'use client';

import { useEffect, useRef, useState } from 'react';
import { ScanLine, Smartphone, Box, Share2 } from 'lucide-react';
import { cn, getDeviceType } from '@/lib/utils';

type ARPlacement = 'floor' | 'wall';

interface ARViewerClientProps {
  /** When omitted, analytics tracking is skipped (catalogue AR launcher case). */
  arLinkId?: string;
  slug: string;
  title: string;
  glbUrl: string;
  usdzUrl?: string;
  posterUrl?: string;
  placement?: ARPlacement;
  /** Present when the worker has scaled the GLB to real-world units.
   *  Forces ar-scale="fixed" so the model renders at real size in AR. */
  hasRealScale?: boolean;
}

export function ARViewerClient({
  arLinkId,
  slug,
  title,
  glbUrl,
  usdzUrl,
  posterUrl,
  placement = 'floor',
  hasRealScale = false,
}: ARViewerClientProps) {
  const analyticsLogged = useRef(false);
  const [shared, setShared] = useState(false);
  const [arPlacement, setArPlacement] = useState<ARPlacement>(placement);
  const [mvLoaded, setMvLoaded] = useState(false);

  // Load model-viewer custom element (browser-only, side-effect import)
  useEffect(() => {
    import('@google/model-viewer').then(() => setMvLoaded(true));
  }, []);

  useEffect(() => {
    if (!arLinkId) return;                     // catalogue AR — skip per-item tracking
    if (analyticsLogged.current) return;
    analyticsLogged.current = true;

    const ua = navigator.userAgent;
    const deviceType = getDeviceType(ua);

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arLinkId, deviceType }),
    }).catch(() => {});
  }, [arLinkId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        setShared(true);
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-brand-600/25">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Placement toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setArPlacement('floor')}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                arPlacement === 'floor'
                  ? 'bg-brand-50 text-brand-700 border-r border-gray-200'
                  : 'bg-white text-gray-500 border-r border-gray-200 hover:text-gray-800',
              )}
            >
              Sol
            </button>
            <button
              type="button"
              onClick={() => setArPlacement('wall')}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                arPlacement === 'wall'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-white text-gray-500 hover:text-gray-800',
              )}
            >
              Mur
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'border transition-colors',
              shared
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
            )}
          >
            <Share2 className="w-3 h-3" />
            {shared ? 'Copié !' : 'Partager'}
          </button>
        </div>
      </header>

      {/* 3D Viewer */}
      <div className="flex-1 relative bg-white" style={{ minHeight: 0 }}>
        {/* Loading overlay — visible until model-viewer script + GLB are ready */}
        {!mvLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="w-full h-full object-contain opacity-40" />
            ) : (
              <Box className="w-16 h-16 text-gray-300 animate-pulse" />
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur border border-gray-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs text-gray-600">Chargement du modèle 3D…</span>
              </div>
            </div>
          </div>
        )}

        {/* model-viewer — always in DOM once mvLoaded, hidden before */}
        {mvLoaded && (
          // @ts-ignore — model-viewer custom element registered at runtime
          <model-viewer
            src={glbUrl}
            ios-src={usdzUrl ?? undefined}
            poster={posterUrl ?? undefined}
            alt={title}
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-placement={arPlacement}
            ar-scale={hasRealScale ? 'fixed' : 'auto'}
            camera-controls
            touch-action="pan-y"
            auto-rotate
            shadow-intensity="1.6"
            shadow-softness="0.85"
            environment-image="neutral"
            exposure="1.05"
            interaction-prompt="auto"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 100%, #e5e7eb 0%, #f3f4f6 35%, #ffffff 70%)',
            }}
          >
            {/* AR launch button — slotted into model-viewer's shadow DOM */}
            <button
              type="button"
              slot="ar-button"
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(to right, #0d9488, #14b8a6)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 20px 25px -5px rgb(13 148 136 / 0.4)',
              }}
            >
              <Smartphone style={{ width: 16, height: 16 }} />
              Voir dans votre espace
            </button>
            {/* @ts-ignore */}
          </model-viewer>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200 bg-white/90">
        <ScanLine className="w-3 h-3 text-brand-500" />
        <span className="text-[10px] text-gray-500">
          Propulsé par <span className="text-brand-600 font-medium">ScanAR</span>
        </span>
      </footer>
    </div>
  );
}

export default ARViewerClient;
