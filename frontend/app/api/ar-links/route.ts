import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';
import type { ApiResponse, ARLink } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const QR_BUCKET = 'qr-codes';
const MAX_SLUG_RETRIES = 5;

// ─── GET /api/ar-links ───────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse<ARLink[]>>> {
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

  const { data, error } = await supabaseAdmin
    .from('ar_links')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data as ARLink[], error: null, success: true });
}

// ─── POST /api/ar-links ──────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<ARLink>>> {
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

  let body: { modelId?: string; title?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const { modelId, title, description } = body;

  if (!modelId) {
    return NextResponse.json(
      { data: null, error: 'modelId is required', success: false },
      { status: 400 },
    );
  }

  // ── Validate model ownership & completion status ─────────────────────────
  const { data: model, error: modelError } = await supabaseAdmin
    .from('models_3d')
    .select('id, user_id, status, name')
    .eq('id', modelId)
    .eq('user_id', session.user.id)
    .single();

  if (modelError || !model) {
    return NextResponse.json(
      { data: null, error: 'Model not found', success: false },
      { status: 404 },
    );
  }

  if (model.status !== 'completed') {
    return NextResponse.json(
      {
        data: null,
        error: `Model processing is not complete (current status: ${model.status})`,
        success: false,
      },
      { status: 422 },
    );
  }

  // ── Generate a unique slug ───────────────────────────────────────────────
  let slug = '';
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const candidate = generateSlug();
    const { data: existing } = await supabaseAdmin
      .from('ar_links')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!existing) {
      slug = candidate;
      break;
    }
  }

  if (!slug) {
    return NextResponse.json(
      { data: null, error: 'Failed to generate unique slug. Please try again.', success: false },
      { status: 500 },
    );
  }

  // ── Generate QR code PNG ─────────────────────────────────────────────────
  const arUrl = `${APP_URL}/ar/${slug}`;
  let qrBuffer: Buffer;

  try {
    qrBuffer = await QRCode.toBuffer(arUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  } catch (qrErr) {
    console.error('[POST /api/ar-links] QR generation failed:', qrErr);
    return NextResponse.json(
      { data: null, error: 'Failed to generate QR code', success: false },
      { status: 500 },
    );
  }

  // ── Upload QR PNG to Supabase Storage ────────────────────────────────────
  const qrPath = `${session.user.id}/${slug}.png`;

  const { error: storageError } = await supabaseAdmin.storage
    .from(QR_BUCKET)
    .upload(qrPath, qrBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (storageError) {
    console.error('[POST /api/ar-links] QR upload failed:', storageError.message);
    return NextResponse.json(
      { data: null, error: `Failed to upload QR code: ${storageError.message}`, success: false },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const qrUrl = `${supabaseUrl}/storage/v1/object/public/${QR_BUCKET}/${qrPath}`;

  // ── Create ar_links record ───────────────────────────────────────────────
  const { data: arLink, error: insertError } = await supabaseAdmin
    .from('ar_links')
    .insert({
      user_id: session.user.id,
      model_id: modelId,
      slug,
      title: title ?? model.name,
      description: description ?? null,
      qr_url: qrUrl,
      qr_path: qrPath,
      is_active: true,
      is_public: true,
      scan_count: 0,
    })
    .select()
    .single();

  if (insertError || !arLink) {
    // Clean up the QR code we just uploaded
    await supabaseAdmin.storage.from(QR_BUCKET).remove([qrPath]);

    return NextResponse.json(
      { data: null, error: insertError?.message ?? 'Failed to create AR link', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { data: arLink as ARLink, error: null, success: true },
    { status: 201 },
  );
}
