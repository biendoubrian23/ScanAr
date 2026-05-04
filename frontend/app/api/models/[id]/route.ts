import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Model3D, ObjectType } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

const VALID_OBJECT_TYPES: ObjectType[] = [
  'object', 'furniture', 'clothing', 'vehicle', 'building', 'character', 'other',
];

// ─── GET /api/models/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<Model3D>>> {
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

  const { data: model, error } = await supabaseAdmin
    .from('models_3d')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !model) {
    return NextResponse.json(
      { data: null, error: 'Model not found', success: false },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: model as Model3D, error: null, success: true });
}

// ─── PATCH /api/models/[id] ──────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<Model3D>>> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  let body: { name?: string; description?: string | null; object_type?: ObjectType };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const updates: {
    name?: string;
    description?: string | null;
    object_type?: ObjectType;
    updated_at?: string;
  } = {};
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.object_type && VALID_OBJECT_TYPES.includes(body.object_type)) {
    updates.object_type = body.object_type;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { data: null, error: 'No updatable fields provided', success: false },
      { status: 400 },
    );
  }

  updates.updated_at = new Date().toISOString();

  const { data: model, error } = await supabaseAdmin
    .from('models_3d')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error || !model) {
    return NextResponse.json(
      { data: null, error: error?.message ?? 'Model not found', success: false },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ data: model as Model3D, error: null, success: true });
}

// ─── DELETE /api/models/[id] ─────────────────────────────────────────────────
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

  // Verify ownership before deleting
  const { data: model, error: fetchError } = await supabaseAdmin
    .from('models_3d')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError || !model) {
    return NextResponse.json(
      { data: null, error: 'Model not found', success: false },
      { status: 404 },
    );
  }

  // ── Remove storage files (best-effort — non-fatal) ───────────────────────
  const filesToRemove: { bucket: string; path: string }[] = [];

  if (model.image_path) {
    filesToRemove.push({ bucket: 'images', path: model.image_path });
  }
  if (model.glb_path) {
    filesToRemove.push({ bucket: 'models', path: model.glb_path });
  }
  if (model.usdz_path) {
    filesToRemove.push({ bucket: 'models', path: model.usdz_path });
  }

  await Promise.allSettled(
    filesToRemove.map(({ bucket, path }) =>
      supabaseAdmin.storage.from(bucket).remove([path]),
    ),
  );

  // ── Delete the database record ───────────────────────────────────────────
  const { error: deleteError } = await supabaseAdmin
    .from('models_3d')
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
