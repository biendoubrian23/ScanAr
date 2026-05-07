import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  Catalogue,
  CatalogueCategory,
  CatalogueDesign,
  CatalogueSocials,
  CatalogueTheme,
  StatsConfig,
} from '@/lib/types';

const VALID_THEMES: CatalogueTheme[] = ['pink', 'beige', 'indigo', 'dark', 'minimal'];
const VALID_STATS_TYPES = new Set(['summary', 'top_viewed', 'top_priced', 'by_category', 'recent']);

function sanitizeStatsConfig(input: unknown): StatsConfig | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as { blocks?: unknown };
  if (!Array.isArray(obj.blocks)) return null;

  const blocks = obj.blocks
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const b = raw as Record<string, unknown>;
      if (typeof b.type !== 'string' || !VALID_STATS_TYPES.has(b.type)) return null;
      const block: StatsConfig['blocks'][number] = { type: b.type as StatsConfig['blocks'][number]['type'] };
      if (typeof b.title === 'string' && b.title.trim()) block.title = b.title.trim().slice(0, 60);
      if (typeof b.limit === 'number' && Number.isFinite(b.limit)) {
        block.limit = Math.max(1, Math.min(20, Math.floor(b.limit)));
      }
      if (b.sort === 'asc' || b.sort === 'desc') block.sort = b.sort;
      return block;
    })
    .filter((b): b is StatsConfig['blocks'][number] => b !== null);

  return { blocks };
}

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/catalogues/[id] ────────────────────────────────────────────────
export async function GET(
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

  const { data, error } = await supabaseAdmin
    .from('catalogues')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: data as Catalogue, error: null, success: true });
}

// ─── PATCH /api/catalogues/[id] ──────────────────────────────────────────────
// Body: any subset of editable fields. layout is intentionally NOT editable
// (decided at creation per the product spec).
export async function PATCH(
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

  let body: {
    title?:         string;
    subtitle?:      string | null;
    location?:      string | null;
    avatar_url?:    string | null;
    theme?:         CatalogueTheme;
    design?:        Partial<CatalogueDesign>;
    categories?:    CatalogueCategory[];
    socials?:       CatalogueSocials;
    is_active?:     boolean;
    is_public?:     boolean;
    stats_visible?: boolean;
    stats_config?:  unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const updates: {
    title?:         string;
    subtitle?:      string | null;
    location?:      string | null;
    avatar_url?:    string | null;
    theme?:         CatalogueTheme;
    design?:        Partial<CatalogueDesign>;
    categories?:    CatalogueCategory[];
    socials?:       Record<string, string>;
    is_active?:     boolean;
    is_public?:     boolean;
    stats_visible?: boolean;
    stats_config?:  StatsConfig;
    updated_at?:    string;
  } = {};

  if (typeof body.title === 'string')      updates.title      = body.title;
  if (body.subtitle   !== undefined)        updates.subtitle   = body.subtitle;
  if (body.location   !== undefined)        updates.location   = body.location;
  if (body.avatar_url !== undefined)        updates.avatar_url = body.avatar_url;
  if (body.theme && VALID_THEMES.includes(body.theme)) updates.theme = body.theme;
  if (body.design && typeof body.design === 'object' && !Array.isArray(body.design)) {
    updates.design = body.design;
  }
  if (Array.isArray(body.categories))       updates.categories = body.categories;
  if (body.socials && typeof body.socials === 'object') updates.socials = body.socials as Record<string, string>;
  if (typeof body.is_active === 'boolean')      updates.is_active     = body.is_active;
  if (typeof body.is_public === 'boolean')      updates.is_public     = body.is_public;
  if (typeof body.stats_visible === 'boolean')  updates.stats_visible = body.stats_visible;
  if (body.stats_config !== undefined) {
    const sanitized = sanitizeStatsConfig(body.stats_config);
    if (sanitized === null) {
      return NextResponse.json(
        { data: null, error: 'Invalid stats_config payload', success: false },
        { status: 400 },
      );
    }
    updates.stats_config = sanitized;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { data: null, error: 'No updatable fields provided', success: false },
      { status: 400 },
    );
  }

  updates.updated_at = new Date().toISOString();

  const { data, error: updateError } = await supabaseAdmin
    .from('catalogues')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (updateError || !data) {
    return NextResponse.json(
      { data: null, error: updateError?.message ?? 'Catalogue not found', success: false },
      { status: updateError ? 500 : 404 },
    );
  }

  // Force-flush the ISR cache for this catalogue's public page so the owner
  // sees their edits immediately instead of waiting for the 10-min revalidate.
  try { revalidatePath(`/c/${data.slug}`); } catch { /* best-effort */ }

  return NextResponse.json({ data: data as Catalogue, error: null, success: true });
}

// ─── DELETE /api/catalogues/[id] ─────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<null>>> {
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
    .select('qr_path')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  if (existing.qr_path) {
    await supabaseAdmin.storage.from('qr-codes').remove([existing.qr_path]);
  }

  const { error: deleteError } = await supabaseAdmin
    .from('catalogues')
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
