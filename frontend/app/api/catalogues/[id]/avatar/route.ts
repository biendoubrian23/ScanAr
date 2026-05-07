import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Catalogue } from '@/lib/types';

const BUCKET = 'catalogue-avatars';
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

type RouteContext = { params: Promise<{ id: string }> };

// ─── POST /api/catalogues/[id]/avatar ────────────────────────────────────────
// Multipart upload — field name: "file"
export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<Catalogue>>> {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('catalogues')
    .select('avatar_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid multipart body', success: false },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { data: null, error: 'Missing "file" field', success: false },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { data: null, error: 'Format non supporté (JPG, PNG ou WebP).', success: false },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { data: null, error: 'Fichier trop lourd (max 3 MB).', success: false },
      { status: 400 },
    );
  }

  const ext = file.type === 'image/png' ? 'png'
            : file.type === 'image/webp' ? 'webp'
            : 'jpg';
  const storagePath = `${userId}/catalogues/${id}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert:      false,
    });

  if (uploadError) {
    return NextResponse.json(
      { data: null, error: `Upload échoué: ${uploadError.message}`, success: false },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('catalogues')
    .update({
      avatar_url:  publicUrl,
      avatar_path: storagePath,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError || !updated) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { data: null, error: updateError?.message ?? 'Erreur de sauvegarde.', success: false },
      { status: 500 },
    );
  }

  if (existing.avatar_path && existing.avatar_path !== storagePath) {
    await supabaseAdmin.storage.from(BUCKET).remove([existing.avatar_path]);
  }

  try { revalidatePath(`/c/${(updated as Catalogue).slug}`); } catch { /* best-effort */ }

  return NextResponse.json({ data: updated as Catalogue, error: null, success: true });
}

// ─── DELETE /api/catalogues/[id]/avatar ──────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<Catalogue>>> {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('catalogues')
    .select('avatar_path')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  if (existing.avatar_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([existing.avatar_path]);
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('catalogues')
    .update({
      avatar_url:  null,
      avatar_path: null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { data: null, error: updateError?.message ?? 'Erreur', success: false },
      { status: 500 },
    );
  }

  try { revalidatePath(`/c/${(updated as Catalogue).slug}`); } catch { /* best-effort */ }

  return NextResponse.json({ data: updated as Catalogue, error: null, success: true });
}
