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
// Auth-required.  Accepts ?from=YYYY-MM-DD&to=YYYY-MM-DD to filter the period.
// Defaults to the last 7 days when no range is supplied.
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<AnalyticsSummary & { daily_buckets: { date: string; count: number }[]; range_days: number }>>> {
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

  const url = new URL(req.url);
  const fromParam = url.searchParams.get('from');
  const toParam   = url.searchParams.get('to');

  // Default range = last 7 days, day-aligned UTC.
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  const defaultFrom = new Date(today);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const fromDate = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : defaultFrom;
  const toDate   = toParam   ? new Date(`${toParam}T23:59:59.999Z`)   : today;

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    return NextResponse.json(
      { data: null, error: 'Invalid date range', success: false },
      { status: 400 },
    );
  }

  const rangeDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;

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

  // Build empty day buckets across the whole range (oldest first)
  const dayBuckets: { date: string; count: number }[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(fromDate);
    d.setUTCDate(d.getUTCDate() + i);
    dayBuckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  const empty = {
    total_scans: 0,
    ios_count: 0,
    android_count: 0,
    desktop_count: 0,
    unknown_count: 0,
    last_7_days: Array(7).fill(0),
    daily_buckets: dayBuckets,
    range_days: rangeDays,
  };

  if (!userLinks || userLinks.length === 0) {
    return NextResponse.json({ data: empty, error: null, success: true });
  }

  const linkIds = userLinks.map((l) => l.id);

  // ── Fetch analytics for those links within range ─────────────────────────
  const { data: rows, error: analyticsError } = await supabaseAdmin
    .from('analytics')
    .select('device_type, scanned_at')
    .in('ar_link_id', linkIds)
    .gte('scanned_at', fromDate.toISOString())
    .lte('scanned_at', toDate.toISOString());

  if (analyticsError) {
    return NextResponse.json(
      { data: null, error: analyticsError.message, success: false },
      { status: 500 },
    );
  }

  // ── Aggregate ────────────────────────────────────────────────────────────
  const summary = { ...empty };
  const dayMap = new Map(dayBuckets.map((b, i) => [b.date, i]));

  for (const row of rows ?? []) {
    summary.total_scans++;

    switch (row.device_type) {
      case 'ios':     summary.ios_count++;     break;
      case 'android': summary.android_count++; break;
      case 'desktop': summary.desktop_count++; break;
      default:        summary.unknown_count++;
    }

    const day = row.scanned_at.slice(0, 10);
    const idx = dayMap.get(day);
    if (idx !== undefined) summary.daily_buckets[idx].count++;
  }

  // Keep legacy last_7_days populated (last 7 entries of buckets)
  summary.last_7_days = summary.daily_buckets.slice(-7).map((b) => b.count);

  return NextResponse.json({ data: summary, error: null, success: true });
}
