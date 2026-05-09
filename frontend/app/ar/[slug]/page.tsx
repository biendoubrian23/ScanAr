import { notFound } from 'next/navigation';
import ReactDOM from 'react-dom';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ARViewerClient } from '@/components/viewers/ARViewerClient';
import { ARLinkExpired } from '@/components/viewers/ARLinkExpired';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: arLink } = await supabaseAdmin
    .from('ar_links')
    .select('title, description, is_active')
    .eq('slug', slug)
    .single();

  if (!arLink || !arLink.is_active) {
    return {
      title: 'Lien AR indisponible',
      description: "Ce lien d'expérience AR n'est plus disponible.",
    };
  }

  return {
    title: arLink.title ?? 'Expérience AR',
    description: arLink.description ?? 'Voir ce modèle 3D en réalité augmentée.',
    openGraph: {
      title: arLink.title ?? 'Expérience AR — ScanAR',
      description: arLink.description ?? 'Voir ce modèle 3D en réalité augmentée.',
    },
  };
}

export default async function ARPage({ params }: Props) {
  const { slug } = await params;

  // Fetch without filtering on is_active so we can show a friendly "expired"
  // page instead of a 404 when the creator has deactivated the link.
  const { data: arLink, error: linkError } = await supabaseAdmin
    .from('ar_links')
    .select('id, model_id, title, slug, is_active, is_public')
    .eq('slug', slug)
    .single();

  if (linkError || !arLink) {
    notFound();
  }

  if (!arLink.is_active || !arLink.is_public) {
    return <ARLinkExpired slug={arLink.slug} title={arLink.title ?? undefined} />;
  }

  const { data: model, error: modelError } = await supabaseAdmin
    .from('models_3d')
    .select('id, glb_url, usdz_url, name, image_url, real_dimensions_cm')
    .eq('id', arLink.model_id)
    .eq('status', 'completed')
    .single();

  if (modelError || !model) {
    notFound();
  }

  // Kick off the GLB download in parallel with the model-viewer JS bundle —
  // shaves ~400-800 ms off the perceived load on cold visits. Hoisted into
  // <head> by Next.js as a <link rel="preload">.
  ReactDOM.preload(model.glb_url!, {
    as: 'fetch',
    crossOrigin: 'anonymous',
    fetchPriority: 'high',
  });

  return (
    <ARViewerClient
      arLinkId={arLink.id}
      slug={arLink.slug}
      title={arLink.title ?? model.name}
      glbUrl={model.glb_url!}
      usdzUrl={model.usdz_url ?? undefined}
      posterUrl={model.image_url ?? undefined}
      hasRealScale={!!model.real_dimensions_cm}
    />
  );
}
