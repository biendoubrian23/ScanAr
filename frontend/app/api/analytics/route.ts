import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDeviceType } from '@/lib/utils';
import type { ApiResponse, AnalyticsSummary } from '@/lib/types';

// ─── POST /api/analytics ─────────────────────────────────────────────────────
// Public endpoint — no auth required.  Records an AR scan event.
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { arLinkId?: string; deviceType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { arLinkId } = body;

  if (!arLinkId) {
    return NextResponse.json({ error: 'arLinkId is required' }, { status: 400 });
  }

  // Derive device type from User-Agent if not explicitly provided
  const rawUserAgent = req.headers.get('user-agent') ?? '';
  const deviceType =
    body.deviceType &&
    ['ios', 'android', 'desktop', 'unknown'].includes(body.deviceType)
      ? (body.deviceType as 'ios' | 'android' | 'desktop' | 'unknown')
      : getDeviceType(rawUserAgent);

  // Verify the AR link exists and is active before recording
  const { data: arLink, error: linkError } = await supabaseAdmin
    .from('ar_links')
    .select('id, is_active')
    .eq('id', arLinkId)
    .single();

  if (linkError || !arLink) {
    return NextResponse.json({ error: 'AR link not found' }, { status: 404 });
  }

  if (!arLink.is_active) {
    return NextResponse.json({ error: 'AR link is not active' }, { status: 403 });
  }

  // Insert analytics row
  const { error: insertError } = await supabaseAdmin.from('analytics').insert({
    ar_link_id: arLinkId,
    device_type: deviceType,
    scanned_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('[POST /api/analytics] insert error:', insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// ─── GET /api/analytics ──────────────────────────────────────────────────────
// Auth-required.  Returns an AnalyticsSummary for all AR links owned by the
// authenticated user.
export async function GET(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse<AnalyticsSummary>>> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  // ── Fetch all ar_link IDs owned by the user ──────────────────────────────
  const { data: userLinks, error: linksError } = await supabaseAdmin
    .from('ar_links')
    .select('id')
    .eq('user_id', session.user.id);

  if (linksError) {
    return NextResponse.json(
      { data: null, error: linksError.message, success: false },
      { status: 500 },
    );
  }

  if (!userLinks || userLinks.length === 0) {
    const empty: AnalyticsSummary = {
      total_scans: 0,
      ios_count: 0,
      android_count: 0,
      desktop_count: 0,
      unknown_count: 0,
      last_7_days: Array(7).fill(0),
    };
    return NextResponse.json({ data: empty, error: null, success: true });
  }

  const linkIds = userLinks.map((l) => l.id);

  // ── Fetch analytics for those links ─────────────────────────────────────
  const { data: rows, error: analyticsError } = await supabaseAdmin
    .from('analytics')
    .select('device_type, scanned_at')
    .in('ar_link_id', linkIds);

  if (analyticsError) {
    return NextResponse.json(
      { data: null, error: analyticsError.message, success: false },
      { status: 500 },
    );
  }

  // ── Aggregate ────────────────────────────────────────────────────────────
  const summary: AnalyticsSummary = {
    total_scans: 0,
    ios_count: 0,
    android_count: 0,
    desktop_count: 0,
    unknown_count: 0,
    last_7_days: Array(7).fill(0),
  };

  const now = new Date();
  // Build date labels for the last 7 days (UTC, day-aligned)
  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dayLabels.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
  }

  for (const row of rows ?? []) {
    summary.total_scans++;

    switch (row.device_type) {
      case 'ios':
        summary.ios_count++;
        break;
      case 'android':
        summary.android_count++;
        break;
      case 'desktop':
        summary.desktop_count++;
        break;
      default:
        summary.unknown_count++;
    }

    const scannedDay = row.scanned_at.slice(0, 10);
    const dayIndex = dayLabels.indexOf(scannedDay);
    if (dayIndex !== -1) {
      summary.last_7_days[dayIndex]++;
    }
  }

  return NextResponse.json({ data: summary, error: null, success: true });
}
