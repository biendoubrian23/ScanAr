'use client';

import { useEffect, useRef, useState } from 'react';
import { ScanLine, Smartphone, Box, Share2 } from 'lucide-react';
import { cn, getDeviceType } from '@/lib/utils';

type ARPlacement = 'floor' | 'wall';

interface ARViewerClientProps {
  arLinkId: string;
  slug: string;
  title: string;
  glbUrl: string;
  usdzUrl?: string;
  posterUrl?: string;
  placement?: ARPlacement;
}

export function ARViewerClient({
  arLinkId,
  slug,
  title,
  glbUrl,
  usdzUrl,
  posterUrl,
  placement = 'floor',
}: ARViewerClientProps) {
  const analyticsLogged = useRef(false);
  const [shared, setShared] = useState(false);
  const [arPlacement, setArPlacement] = useState<ARPlacement>(placement);

  useEffect(() => {
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
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dark-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-brand-600/25">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 truncate">{title}</p>
            <p className="text-[10px] text-zinc-600 font-mono">/{slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Placement toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setArPlacement('floor')}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                arPlacement === 'floor'
                  ? 'bg-brand-600/30 text-brand-300 border-r border-white/10'
                  : 'bg-white/5 text-zinc-500 border-r border-white/10 hover:text-zinc-300',
              )}
            >
              Floor
            </button>
            <button
              type="button"
              onClick={() => setArPlacement('wall')}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                arPlacement === 'wall'
                  ? 'bg-brand-600/30 text-brand-300'
                  : 'bg-white/5 text-zinc-500 hover:text-zinc-300',
              )}
            >
              Wall
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'border transition-colors',
              shared
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10',
            )}
          >
            <Share2 className="w-3 h-3" />
            {shared ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <model-viewer
          src={glbUrl}
          ios-src={usdzUrl}
          poster={posterUrl}
          alt={title}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement={arPlacement}
          ar-scale="auto"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          shadow-intensity="1"
          shadow-softness="0.5"
          environment-image="neutral"
          exposure="1"
          interaction-prompt="auto"
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        >
          {/* AR button */}
          <button
            type="button"
            slot="ar-button"
            className={cn(
              'absolute bottom-6 left-1/2 -translate-x-1/2 z-10',
              'flex items-center gap-2 px-6 py-3 rounded-xl',
              'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
              'shadow-xl shadow-brand-600/40',
              'text-sm font-semibold',
              'hover:from-brand-500 hover:to-brand-400 transition-all',
            )}
          >
            <Smartphone className="w-4 h-4" />
            View in your space
          </button>

          {/* Loading state */}
          <div slot="poster" className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="w-full h-full object-contain opacity-50" />
            ) : (
              <Box className="w-16 h-16 text-zinc-700 animate-pulse" />
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur border border-white/10">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs text-zinc-400">Loading 3D model...</span>
              </div>
            </div>
          </div>
        </model-viewer>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/10 bg-dark-950/90">
        <ScanLine className="w-3 h-3 text-brand-500" />
        <span className="text-[10px] text-zinc-600">
          Powered by <span className="text-brand-400 font-medium">ScanAR</span>
        </span>
      </footer>
    </div>
  );
}

export default ARViewerClient;
