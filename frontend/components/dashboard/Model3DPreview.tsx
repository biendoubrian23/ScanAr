'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  RotateCw,
  MousePointer2,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Model3DPreviewProps {
  glbUrl: string | null;
  usdzUrl?: string | null;
  imageUrl: string | null;
  imageUrls?: string[] | null;
  alt: string;
  className?: string;
}

/**
 * 3D-first model preview.
 *
 *  - Defaults to the model-viewer GLB rendering with orbit controls.
 *  - A toggle pill (top-right) flips between 3D and the source image.
 *  - The viewer sits on a soft studio backdrop (gradient floor) instead of a
 *    flat black panel, with a contact shadow that adds depth.
 *  - A small compass / axis gizmo in the bottom-left tracks the current
 *    camera orientation so the user always knows which way is which.
 *  - Image mode uses `object-contain` so the photo never overflows or crops.
 */
export function Model3DPreview({
  glbUrl,
  usdzUrl,
  imageUrl,
  imageUrls,
  alt,
  className,
}: Model3DPreviewProps) {
  const has3D = Boolean(glbUrl);
  const viewerRef = useRef<HTMLElement | null>(null);

  // Build the gallery: prefer imageUrls (multi-view) and fall back to imageUrl.
  const gallery = (imageUrls && imageUrls.length > 0)
    ? imageUrls
    : (imageUrl ? [imageUrl] : []);
  const hasMultiple = gallery.length > 1;

  const [showImage, setShowImage]     = useState(!has3D);
  const [mvLoaded, setMvLoaded]       = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [yaw, setYaw]                 = useState(0);     // degrees, 0 = facing camera
  const [activeIdx, setActiveIdx]     = useState(0);
  const activeImage = gallery[activeIdx] ?? null;

  // Lazy-load model-viewer once, only if a GLB is available
  useEffect(() => {
    if (!has3D || mvLoaded) return;
    import('@google/model-viewer').then(() => setMvLoaded(true));
  }, [has3D, mvLoaded]);

  // Auto-hide the rotation hint after a few seconds
  useEffect(() => {
    if (!hintVisible || showImage) return;
    const t = setTimeout(() => setHintVisible(false), 4500);
    return () => clearTimeout(t);
  }, [hintVisible, showImage]);

  // Track camera yaw from model-viewer so the compass updates live.
  useEffect(() => {
    if (!mvLoaded || showImage) return;
    const el = viewerRef.current as (HTMLElement & { getCameraOrbit?: () => { theta: number } }) | null;
    if (!el) return;

    let raf = 0;
    const update = () => {
      try {
        const orbit = el.getCameraOrbit?.();
        if (orbit) setYaw(((orbit.theta * 180) / Math.PI) % 360);
      } catch { /* model-viewer not ready */ }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [mvLoaded, showImage]);

  return (
    <div
      className={cn(
        // Soft studio backdrop — a vertical gradient that fakes a horizon line
        // gives depth without pulling focus away from the model.
        'relative w-full mx-auto aspect-[3/4] max-h-[580px]',
        'rounded-2xl overflow-hidden border border-gray-200',
        'bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200',
        className,
      )}
    >
      {/* Subtle floor highlight — adds the "object on a table" feel */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center bottom, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0) 65%)',
        }}
        aria-hidden="true"
      />

      {/* Background poster — visible in image mode and as a 3D loading state */}
      {activeImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={activeImage}
          src={activeImage}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300',
            !showImage && mvLoaded ? 'opacity-0' : 'opacity-100',
            // Leave room for the thumbnail strip when in image mode + multi
            showImage && hasMultiple && 'pb-24',
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-slate-400" />
        </div>
      )}

      {/* Source images thumbnail strip — shown only in image mode when there
          are multiple source views (multi-view 3D reconstruction). */}
      {showImage && hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow-sm max-w-[calc(100%-1.5rem)] overflow-x-auto scrollbar-thin">
          {gallery.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Image source ${i + 1}`}
              aria-pressed={i === activeIdx ? 'true' : 'false'}
              className={cn(
                'relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border transition-all',
                i === activeIdx
                  ? 'border-brand-600 ring-2 ring-brand-500/30'
                  : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-white bg-black/60 rounded px-1 leading-tight">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* model-viewer — mounted as soon as the script loads */}
      {has3D && mvLoaded && !showImage && (
        // @ts-ignore — model-viewer is a custom element registered at runtime
        <model-viewer
          ref={viewerRef}
          src={glbUrl ?? undefined}
          ios-src={usdzUrl ?? undefined}
          alt={alt}
          camera-controls
          auto-rotate
          touch-action="pan-y"
          shadow-intensity="1.2"
          shadow-softness="0.7"
          environment-image="neutral"
          exposure="1.05"
          interaction-prompt="none"
          onPointerDown={() => setHintVisible(false)}
          onTouchStart={() => setHintVisible(false)}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
        />
      )}

      {/* Loading overlay while model-viewer script loads */}
      {has3D && !mvLoaded && !showImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Chargement du modèle 3D…
          </div>
        </div>
      )}

      {/* Top-right toggle (3D ⇄ Image) — visible only when 3D is available */}
      {has3D && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-white/90 border border-gray-200 backdrop-blur p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowImage(false)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-colors',
              !showImage ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            <Box className="w-3.5 h-3.5" />
            3D
          </button>
          <button
            type="button"
            onClick={() => setShowImage(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-colors',
              showImage ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>
        </div>
      )}

      {/* 3D axis compass (bottom-left) — vertical pill that mirrors the
          orientation gizmos found in 3D editors (Blender / Three.js). */}
      {has3D && !showImage && mvLoaded && (
        <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl bg-white/90 border border-gray-200 backdrop-blur shadow-sm">
          <AxisGizmo yaw={yaw} />
          <div className="flex flex-col items-center text-[9px] uppercase tracking-wider font-semibold leading-tight">
            <span className="text-red-500">X</span>
            <span className="text-emerald-500">Y</span>
            <span className="text-sky-500">Z</span>
          </div>
        </div>
      )}

      {/* Rotation hint — soft pulsing badge that auto-dismisses */}
      {has3D && !showImage && mvLoaded && hintVisible && (
        <button
          type="button"
          onClick={() => setHintVisible(false)}
          className={cn(
            'absolute bottom-3 left-1/2 -translate-x-1/2 z-10',
            'inline-flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full',
            'bg-white hover:bg-gray-50 text-gray-800 text-xs font-medium',
            'shadow-md border border-gray-200 transition-all',
            'animate-[fade-in-up_300ms_ease-out]',
          )}
        >
          <span className="relative flex items-center justify-center">
            <RotateCw className="w-4 h-4 text-brand-600 animate-spin-slow" />
            <MousePointer2 className="absolute w-2.5 h-2.5 text-gray-700" style={{ transform: 'translate(7px, 7px)' }} />
          </span>
          Glissez pour faire pivoter
        </button>
      )}

      {/* No GLB available */}
      {!has3D && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-white/90 border border-gray-200 text-gray-600 text-xs shadow-sm">
          Modèle 3D pas encore disponible
        </div>
      )}
    </div>
  );
}

// ─── Axis compass ──────────────────────────────────────────────────────────

function AxisGizmo({ yaw }: { yaw: number }) {
  // Yaw is the camera's horizontal angle (radians → deg). We rotate the gizmo
  // counter-clockwise so the world-X axis stays anchored visually as the user
  // orbits the model.
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 40 40"
      style={{ transform: `rotate(${-yaw}deg)`, transition: 'transform 80ms linear' }}
      aria-hidden="true"
    >
      <line x1="20" y1="20" x2="36" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <text x="36" y="18" fontSize="8" fill="#ef4444" fontWeight="700">X</text>
      <line x1="20" y1="20" x2="20" y2="4"  stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <text x="22" y="8"  fontSize="8" fill="#22c55e" fontWeight="700">Y</text>
      <line x1="20" y1="20" x2="9"  y2="31" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <text x="2"  y="38" fontSize="8" fill="#3b82f6" fontWeight="700">Z</text>
      <circle cx="20" cy="20" r="2" fill="#475569" />
    </svg>
  );
}

export default Model3DPreview;
