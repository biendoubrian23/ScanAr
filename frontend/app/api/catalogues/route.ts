import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';
import type { ApiResponse, Catalogue, CatalogueLayout, CatalogueTheme } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const QR_BUCKET = 'qr-codes';
const MAX_SLUG_RETRIES = 5;

const VALID_LAYOUTS: CatalogueLayout[] = ['vertical', 'horizontal'];
const VALID_THEMES:  CatalogueTheme[]  = ['pink', 'beige', 'indigo', 'dark', 'minimal'];

// ─── GET /api/catalogues ─────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse<Catalogue[]>>> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('catalogues')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data as Catalogue[], error: null, success: true });
}

// ─── POST /api/catalogues ────────────────────────────────────────────────────
// Body: { title: string; layout?: CatalogueLayout; theme?: CatalogueTheme; subtitle?: string }
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Catalogue>>> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  let body: {
    title?:    string;
    subtitle?: string;
    layout?:   CatalogueLayout;
    theme?:    CatalogueTheme;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json(
      { data: null, error: 'title is required', success: false },
      { status: 400 },
    );
  }

  const layout = body.layout && VALID_LAYOUTS.includes(body.layout) ? body.layout : 'vertical';
  const theme  = body.theme  && VALID_THEMES.includes(body.theme)   ? body.theme  : 'minimal';

  // ── Generate a unique slug ───────────────────────────────────────────────
  let slug = '';
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const candidate = generateSlug();
    const { data: existing } = await supabaseAdmin
      .from('catalogues')
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
  const publicUrl = `${APP_URL}/c/${slug}`;
  let qrBuffer: Buffer;

  try {
    qrBuffer = await QRCode.toBuffer(publicUrl, {
      type:   'png',
      width:  512,
      margin: 2,
      color:  { dark: '#000000', light: '#FFFFFF' },
    });
  } catch (qrErr) {
    console.error('[POST /api/catalogues] QR generation failed:', qrErr);
    return NextResponse.json(
      { data: null, error: 'Failed to generate QR code', success: false },
      { status: 500 },
    );
  }

  const qrPath = `${session.user.id}/catalogue-${slug}.png`;
  const { error: storageError } = await supabaseAdmin.storage
    .from(QR_BUCKET)
    .upload(qrPath, qrBuffer, {
      contentType: 'image/png',
      upsert:      false,
    });

  if (storageError) {
    console.error('[POST /api/catalogues] QR upload failed:', storageError.message);
    return NextResponse.json(
      { data: null, error: `Failed to upload QR code: ${storageError.message}`, success: false },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const qrUrl = `${supabaseUrl}/storage/v1/object/public/${QR_BUCKET}/${qrPath}`;

  // ── Insert catalogue ─────────────────────────────────────────────────────
  const { data: catalogue, error: insertError } = await supabaseAdmin
    .from('catalogues')
    .insert({
      user_id:    session.user.id,
      slug,
      title,
      subtitle:   body.subtitle?.trim() || null,
      layout,
      theme,
      categories: [],
      socials:    {},
      qr_url:     qrUrl,
      qr_path:    qrPath,
      is_active:  true,
      is_public:  true,
      view_count: 0,
    })
    .select()
    .single();

  if (insertError || !catalogue) {
    await supabaseAdmin.storage.from(QR_BUCKET).remove([qrPath]);
    return NextResponse.json(
      { data: null, error: insertError?.message ?? 'Failed to create catalogue', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { data: catalogue as Catalogue, error: null, success: true },
    { status: 201 },
  );
}
