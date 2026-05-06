'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ImagePlus, Video, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDropdownButtonProps {
  onSelectImage: () => void;
  className?: string;
}

/**
 * Bouton "Importer" avec un chevron qui ouvre un menu — pour le MVP une seule
 * option (depuis une image) est cliquable, les autres sont visibles mais
 * désactivées et marquées "Bientôt".
 */
export function UploadDropdownButton({ onSelectImage, className }: UploadDropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative hidden sm:inline-flex', className)}>
      <button
        type="button"
        onClick={onSelectImage}
        className={cn(
          'inline-flex items-center gap-2 h-10 pl-5 pr-3 rounded-l-full rounded-r-none',
          'bg-brand-500 text-white text-sm font-medium',
          'shadow-[0_4px_14px_rgba(13,148,136,0.35)]',
          'hover:bg-brand-600 active:bg-brand-700 transition-all',
        )}
      >
        <Plus className="w-4 h-4 sm:hidden" />
        <span className="hidden sm:inline">Nouveau modèle</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir le menu d'import"
        className={cn(
          'inline-flex items-center justify-center h-10 w-10 rounded-r-full rounded-l-none',
          'bg-brand-500 text-white border-l border-brand-400/30',
          'hover:bg-brand-600 active:bg-brand-700 transition-all',
          'shadow-[0_4px_14px_rgba(13,148,136,0.35)]',
        )}
      >
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 mt-2 w-64 z-50',
            'bg-white/50 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSelectImage();
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/60 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
              <ImagePlus className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Depuis une image</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP — max 10 Mo</p>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSelectImage();
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/60 text-left transition-colors border-t border-gray-100/40"
          >
            <div className="w-8 h-8 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Multi-photos</p>
              <p className="text-xs text-gray-500">1 à 4 angles pour un meilleur rendu 3D</p>
            </div>
          </button>

          <div className="px-3 py-2.5 flex items-start gap-3 opacity-50 cursor-not-allowed border-t border-gray-100/40">
            <div className="w-8 h-8 rounded-2xl bg-gray-100/60 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700">Depuis une vidéo</p>
              <p className="text-xs text-gray-400">Capture multi-angle automatique</p>
            </div>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 bg-gray-100/70 px-1.5 py-0.5 rounded-full shrink-0">
              Bientôt
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadDropdownButton;
