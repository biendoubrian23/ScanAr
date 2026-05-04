'use client';

import { useEffect, useState } from 'react';
import { Box, Loader2, Maximize2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Model3DPreviewProps {
  glbUrl: string | null;
  usdzUrl?: string | null;
  imageUrl: string | null;
  alt: string;
  className?: string;
}

/**
 * Two-state preview:
 *  - Default: shows the source image, with a "Voir en 3D" CTA overlay.
 *  - Active: lazy-loads model-viewer and renders the GLB with orbit controls.
 *
 * Falls back to the image if no GLB is available, or if model-viewer fails to
 * load.
 */
export function Model3DPreview({
  glbUrl,
  usdzUrl,
  imageUrl,
  alt,
  className,
}: Model3DPreviewProps) {
  const [active, setActive] = useState(false);
  const [mvLoaded, setMvLoaded] = useState(false);

  useEffect(() => {
    if (!active || mvLoaded) return;
    import('@google/model-viewer').then(() => setMvLoaded(true));
  }, [active, mvLoaded]);

  return (
    <div
      className={cn(
        'relative w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950 border border-gray-200',
        className,
      )}
    >
      {/* Background image (always there as poster / loading state) */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            active && mvLoaded ? 'opacity-0' : 'opacity-100',
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-zinc-700" />
        </div>
      )}

      {/* 3D viewer */}
      {active && mvLoaded && glbUrl && (
        // @ts-ignore — model-viewer custom element loaded at runtime
        <model-viewer
          src={glbUrl}
          ios-src={usdzUrl ?? undefined}
          alt={alt}
          camera-controls
          auto-rotate
          touch-action="pan-y"
          shadow-intensity="1"
          shadow-softness="0.5"
          environment-image="neutral"
          exposure="1"
          interaction-prompt="auto"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            backgroundColor: '#09090b',
          }}
        />
      )}

      {/* Loading overlay while model-viewer script loads */}
      {active && !mvLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Chargement du modèle 3D…
          </div>
        </div>
      )}

      {/* Toggle CTA */}
      {!active && glbUrl && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className={cn(
            'absolute bottom-4 left-1/2 -translate-x-1/2 z-10',
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-white/95 hover:bg-white text-gray-900 text-sm font-medium',
            'shadow-lg backdrop-blur transition-all',
          )}
        >
          <Box className="w-4 h-4" />
          Voir en 3D
        </button>
      )}

      {/* Fullscreen button when active */}
      {active && glbUrl && (
        <button
          type="button"
          onClick={() => setActive(false)}
          aria-label="Revenir à la photo"
          className={cn(
            'absolute top-3 right-3 z-10',
            'inline-flex items-center justify-center w-8 h-8 rounded-lg',
            'bg-black/60 hover:bg-black/80 text-white backdrop-blur transition-colors',
          )}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {!glbUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs backdrop-blur">
          Modèle 3D pas encore disponible
        </div>
      )}
    </div>
  );
}

export default Model3DPreview;
