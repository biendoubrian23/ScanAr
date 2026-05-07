import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ARViewerClient } from '@/components/viewers/ARViewerClient';
import { CatalogueClosed } from '@/components/catalogues/CatalogueClosed';
import type { CatalogueItem, Model3D } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string; itemId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title:       'Voir en AR — ScanAR',
    description: `Modèle 3D du catalogue ${slug} en réalité augmentée.`,
  };
}

export default async function CatalogueARPage({ params }: Props) {
  const { slug, itemId } = await params;

  // ── 1. Fetch the catalogue (must be public) ──────────────────────────────
  const { data: catalogue, error: catError } = await supabaseAdmin
    .from('catalogues')
    .select('id, slug, title, is_active, is_public')
    .eq('slug', slug)
    .single();

  if (catError || !catalogue) notFound();
  if (!catalogue.is_active || !catalogue.is_public) {
    return <CatalogueClosed slug={catalogue.slug} title={catalogue.title} />;
  }

  // ── 2. Fetch the item (must belong to that catalogue) ────────────────────
  const { data: itemRaw, error: itemError } = await supabaseAdmin
    .from('catalogue_items')
    .select('*, model:models_3d(*)')
    .eq('id', itemId)
    .eq('catalogue_id', catalogue.id)
    .single();

  const item = itemRaw as (CatalogueItem & { model: Model3D | null }) | null;

  if (itemError || !item || !item.model) notFound();

  const model = item.model;
  if (model.status !== 'completed' || !model.glb_url) notFound();

  const title = item.custom_label || model.name || 'Modèle 3D';

  // Route GLB/USDZ through our caching proxy — same Supabase egress for 1
  // visitor as for 1000 (after 1st warm-up). See `/api/models/[id]/asset`.
  const glbUrl  = `/api/models/${model.id}/asset?type=glb`;
  const usdzUrl = model.usdz_url ? `/api/models/${model.id}/asset?type=usdz` : undefined;

  return (
    <ARViewerClient
      // arLinkId omitted on purpose: catalogue analytics live on `catalogues.view_count`
      slug={`${slug}/${item.id}`}
      title={title}
      glbUrl={glbUrl}
      usdzUrl={usdzUrl}
      posterUrl={model.image_url ?? undefined}
    />
  );
}
