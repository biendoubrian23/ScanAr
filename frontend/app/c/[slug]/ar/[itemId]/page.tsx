import { notFound } from 'next/navigation';
import ReactDOM from 'react-dom';
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

  // Kick off the GLB download in parallel with the model-viewer JS bundle —
  // shaves ~400-800 ms off the perceived load on cold visits.
  ReactDOM.preload(model.glb_url, {
    as: 'fetch',
    crossOrigin: 'anonymous',
    fetchPriority: 'high',
  });

  return (
    <ARViewerClient
      // arLinkId omitted on purpose: catalogue analytics live on `catalogues.view_count`
      slug={`${slug}/${item.id}`}
      title={title}
      glbUrl={model.glb_url}
      usdzUrl={model.usdz_url ?? undefined}
      posterUrl={model.image_url ?? undefined}
      hasRealScale={!!model.real_dimensions_cm}
    />
  );
}
