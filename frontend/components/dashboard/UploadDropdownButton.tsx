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
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={onSelectImage}
        className={cn(
          'inline-flex items-center gap-2 h-10 pl-4 pr-3 rounded-l-xl rounded-r-none',
          'bg-brand-600 text-white text-sm font-medium shadow-sm',
          'hover:bg-brand-700 active:bg-brand-800 transition-colors',
          'border border-brand-600',
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
          'inline-flex items-center justify-center h-10 w-10 rounded-r-xl rounded-l-none',
          'bg-brand-600 text-white border border-l-0 border-brand-600',
          'hover:bg-brand-700 active:bg-brand-800 transition-colors',
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
            'absolute top-full right-0 mt-2 w-64 z-30',
            'bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSelectImage();
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <ImagePlus className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Depuis une image</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP — max 10 Mo</p>
            </div>
          </button>

          <div className="px-3 py-2.5 flex items-start gap-3 opacity-60 cursor-not-allowed">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700">Depuis une vidéo</p>
              <p className="text-xs text-gray-400">Capture multi-angle automatique</p>
            </div>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
              Bientôt
            </span>
          </div>

          <div className="px-3 py-2.5 flex items-start gap-3 opacity-60 cursor-not-allowed">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700">Multi-photos</p>
              <p className="text-xs text-gray-400">Plusieurs angles d'un même produit</p>
            </div>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
              Bientôt
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadDropdownButton;
