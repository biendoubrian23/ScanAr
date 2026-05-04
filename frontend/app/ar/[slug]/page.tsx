import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ARViewerClient } from '@/components/viewers/ARViewerClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: arLink } = await supabaseAdmin
    .from('ar_links')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return {
    title: arLink?.title ?? 'AR Experience',
    description: arLink?.description ?? 'View this 3D model in augmented reality.',
    openGraph: {
      title: arLink?.title ?? 'AR Experience — ScanAR',
      description: arLink?.description ?? 'View this 3D model in augmented reality.',
    },
  };
}

export default async function ARPage({ params }: Props) {
  const { slug } = await params;

  const { data: arLink, error: linkError } = await supabaseAdmin
    .from('ar_links')
    .select('id, model_id, title, slug, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('is_public', true)
    .single();

  if (linkError || !arLink) {
    notFound();
  }

  const { data: model, error: modelError } = await supabaseAdmin
    .from('models_3d')
    .select('id, glb_url, usdz_url, name, image_url')
    .eq('id', arLink.model_id)
    .eq('status', 'completed')
    .single();

  if (modelError || !model) {
    notFound();
  }

  return (
    <ARViewerClient
      arLinkId={arLink.id}
      slug={arLink.slug}
      title={arLink.title ?? model.name}
      glbUrl={model.glb_url!}
      usdzUrl={model.usdz_url ?? undefined}
      posterUrl={model.image_url ?? undefined}
    />
  );
}
