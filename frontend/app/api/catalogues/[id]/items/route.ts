import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, CatalogueItem, CatalogueItemWithModel, Model3D } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

interface RawJoinedItem extends Omit<CatalogueItem, never> {
  model: Model3D | null;
}

async function ensureOwnership(catalogueId: string, userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('catalogues')
    .select('id')
    .eq('id', catalogueId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// ─── GET /api/catalogues/[id]/items ──────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<CatalogueItemWithModel[]>>> {
  const { id: catalogueId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  if (!(await ensureOwnership(catalogueId, session.user.id))) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('catalogue_items')
    .select('*, model:models_3d(*)')
    .eq('catalogue_id', catalogueId)
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message, success: false },
      { status: 500 },
    );
  }

  // Filter out any orphan items (model deleted) and cast.
  const items = (data as RawJoinedItem[])
    .filter((it) => it.model !== null)
    .map((it) => it as CatalogueItemWithModel);

  return NextResponse.json({ data: items, error: null, success: true });
}

// ─── PUT /api/catalogues/[id]/items ──────────────────────────────────────────
// Replace the catalogue's items in one shot. Body: { items: Array<...> }.
// position is taken from index in the array (ignores any provided value).
export async function PUT(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<CatalogueItem[]>>> {
  const { id: catalogueId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  if (!(await ensureOwnership(catalogueId, session.user.id))) {
    return NextResponse.json(
      { data: null, error: 'Catalogue not found', success: false },
      { status: 404 },
    );
  }

  let body: {
    items?: Array<{
      model_id:            string;
      custom_label?:       string | null;
      custom_description?: string | null;
      price?:              string | null;
      badge?:              string | null;
      category_id?:        string | null;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const items = body.items ?? [];

  // ── Validate: all model_ids belong to the user ──────────────────────────
  if (items.length > 0) {
    const modelIds = items.map((it) => it.model_id);
    const { data: ownedModels } = await supabaseAdmin
      .from('models_3d')
      .select('id')
      .in('id', modelIds)
      .eq('user_id', session.user.id);

    const ownedSet = new Set((ownedModels ?? []).map((m) => m.id));
    if (items.some((it) => !ownedSet.has(it.model_id))) {
      return NextResponse.json(
        { data: null, error: 'One or more models do not belong to you', success: false },
        { status: 403 },
      );
    }
  }

  // ── Replace items: simplest correct approach is delete-all then insert ──
  const { error: deleteError } = await supabaseAdmin
    .from('catalogue_items')
    .delete()
    .eq('catalogue_id', catalogueId);

  if (deleteError) {
    return NextResponse.json(
      { data: null, error: deleteError.message, success: false },
      { status: 500 },
    );
  }

  if (items.length === 0) {
    // Touch parent so updated_at moves forward
    await supabaseAdmin
      .from('catalogues')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', catalogueId);
    return NextResponse.json({ data: [], error: null, success: true });
  }

  const rows = items.map((it, idx) => ({
    catalogue_id:        catalogueId,
    model_id:            it.model_id,
    position:            idx,
    custom_label:        it.custom_label       ?? null,
    custom_description:  it.custom_description ?? null,
    price:               it.price              ?? null,
    badge:               it.badge              ?? null,
    category_id:         it.category_id        ?? null,
  }));

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('catalogue_items')
    .insert(rows)
    .select();

  if (insertError || !inserted) {
    return NextResponse.json(
      { data: null, error: insertError?.message ?? 'Failed to insert items', success: false },
      { status: 500 },
    );
  }

  // Touch parent so updated_at moves forward
  await supabaseAdmin
    .from('catalogues')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', catalogueId);

  return NextResponse.json({ data: inserted as CatalogueItem[], error: null, success: true });
}
