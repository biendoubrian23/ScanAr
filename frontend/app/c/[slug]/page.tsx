import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CatalogueClosed } from '@/components/catalogues/CatalogueClosed';
import { VerticalCatalogueView } from '@/components/catalogues/VerticalCatalogueView';
import { HorizontalCatalogueView } from '@/components/catalogues/HorizontalCatalogueView';
import type { Catalogue, CatalogueItemWithModel, Model3D } from '@/lib/types';

// ISR — la page est cachée 10 min côté Next.js (Vercel ou node). Les modifs
// de design apparaissent au plus tard ~10 min après la sauvegarde. Le owner
// peut forcer un refresh immédiat via /api/catalogues/[id]/revalidate.
export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: cat } = await supabaseAdmin
    .from('catalogues')
    .select('title, subtitle, is_active, is_public')
    .eq('slug', slug)
    .single();

  if (!cat || !cat.is_active || !cat.is_public) {
    return {
      title:       'Catalogue indisponible',
      description: "Ce catalogue n'est pas accessible publiquement.",
    };
  }

  return {
    title:       cat.title,
    description: cat.subtitle ?? 'Découvrez ce catalogue en réalité augmentée.',
    openGraph: {
      title:       `${cat.title} — ScanAR`,
      description: cat.subtitle ?? 'Découvrez ce catalogue en réalité augmentée.',
    },
  };
}

export default async function CataloguePublicPage({ params }: Props) {
  const { slug } = await params;

  // ── 1. Fetch catalogue ───────────────────────────────────────────────────
  const { data: catalogue, error: catError } = await supabaseAdmin
    .from('catalogues')
    .select('*')
    .eq('slug', slug)
    .single();

  if (catError || !catalogue) {
    notFound();
  }

  if (!catalogue.is_active || !catalogue.is_public) {
    return <CatalogueClosed slug={catalogue.slug} title={catalogue.title} />;
  }

  // ── 2. Fetch items joined with their models ──────────────────────────────
  const { data: rawItems } = await supabaseAdmin
    .from('catalogue_items')
    .select('*, model:models_3d(*)')
    .eq('catalogue_id', catalogue.id)
    .order('position', { ascending: true });

  type RawItem = CatalogueItemWithModel & { model: Model3D | null };

  const items = ((rawItems ?? []) as RawItem[])
    .filter((it) => it.model !== null && it.model.status === 'completed') as CatalogueItemWithModel[];

  // ── 3. Render the layout chosen at creation ──────────────────────────────
  // The view increment now happens client-side via /api/catalogues/track,
  // which inserts a `catalogue_view` event whose DB trigger bumps view_count.
  if (catalogue.layout === 'horizontal') {
    return <HorizontalCatalogueView catalogue={catalogue as Catalogue} items={items} />;
  }
  return <VerticalCatalogueView catalogue={catalogue as Catalogue} items={items} />;
}
