import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ARLink } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ar-links/[id] ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<ARLink>>> {
  const { id } = await params;

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

  const { data: arLink, error } = await supabaseAdmin
    .from('ar_links')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !arLink) {
    return NextResponse.json(
      { data: null, error: 'AR link not found', success: false },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: arLink as ARLink, error: null, success: true });
}

// ─── PATCH /api/ar-links/[id] ────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<ARLink>>> {
  const { id } = await params;

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

  let body: { title?: string; description?: string; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  // Only allow updating these three fields
  const updates: Partial<{ title: string; description: string; is_active: boolean }> = {};

  if (typeof body.title === 'string') updates.title = body.title;
  if (typeof body.description === 'string') updates.description = body.description;
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { data: null, error: 'No updatable fields provided', success: false },
      { status: 400 },
    );
  }

  const { data: arLink, error: updateError } = await supabaseAdmin
    .from('ar_links')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (updateError || !arLink) {
    return NextResponse.json(
      { data: null, error: updateError?.message ?? 'AR link not found', success: false },
      { status: updateError ? 500 : 404 },
    );
  }

  return NextResponse.json({ data: arLink as ARLink, error: null, success: true });
}

// ─── DELETE /api/ar-links/[id] ───────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;

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

  // Fetch first to get storage path and verify ownership
  const { data: arLink, error: fetchError } = await supabaseAdmin
    .from('ar_links')
    .select('qr_path')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError || !arLink) {
    return NextResponse.json(
      { data: null, error: 'AR link not found', success: false },
      { status: 404 },
    );
  }

  // ── Remove QR code from storage (best-effort) ────────────────────────────
  if (arLink.qr_path) {
    await supabaseAdmin.storage.from('qr-codes').remove([arLink.qr_path]);
  }

  // ── Delete the database record ───────────────────────────────────────────
  const { error: deleteError } = await supabaseAdmin
    .from('ar_links')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (deleteError) {
    return NextResponse.json(
      { data: null, error: deleteError.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: null, error: null, success: true });
}
