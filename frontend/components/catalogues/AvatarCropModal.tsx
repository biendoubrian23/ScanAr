'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarCropModalProps {
  file:        File;
  outputSize?: number;
  onConfirm:   (blob: Blob) => void | Promise<void>;
  onCancel:    () => void;
}

const VIEWPORT = 280;

export function AvatarCropModal({
  file,
  outputSize = 512,
  onConfirm,
  onCancel,
}: AvatarCropModalProps) {
  const [img, setImg]             = useState<HTMLImageElement | null>(null);
  const [scale, setScale]         = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [busy, setBusy]           = useState(false);

  const minScaleRef = useRef(1);
  const dragRef     = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i   = new Image();
    i.onload = () => {
      const ms = Math.max(VIEWPORT / i.width, VIEWPORT / i.height);
      minScaleRef.current = ms;
      setScale(ms);
      setTranslate({
        x: (VIEWPORT - i.width  * ms) / 2,
        y: (VIEWPORT - i.height * ms) / 2,
      });
      setImg(i);
    };
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const constrain = (tx: number, ty: number, s: number): { x: number; y: number } => {
    if (!img) return { x: tx, y: ty };
    const w = img.width  * s;
    const h = img.height * s;
    return {
      x: Math.min(0, Math.max(VIEWPORT - w, tx)),
      y: Math.min(0, Math.max(VIEWPORT - h, ty)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setTranslate(constrain(dragRef.current.tx + dx, dragRef.current.ty + dy, scale));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const handleZoom = (newScale: number) => {
    const cx = VIEWPORT / 2;
    const cy = VIEWPORT / 2;
    const ix = (cx - translate.x) / scale;
    const iy = (cy - translate.y) / scale;
    const nx = cx - ix * newScale;
    const ny = cy - iy * newScale;
    setScale(newScale);
    setTranslate(constrain(nx, ny, newScale));
  };

  const handleConfirm = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const srcX    = -translate.x / scale;
      const srcY    = -translate.y / scale;
      const srcSize = VIEWPORT / scale;

      const canvas  = document.createElement('canvas');
      canvas.width  = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas non supporté.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);

      const mime    = file.type === 'image/png' ? 'image/png' : 'image/webp';
      const quality = mime === 'image/webp' ? 0.9 : undefined;
      const blob    = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, mime, quality),
      );
      if (!blob) throw new Error('Conversion échouée.');
      await onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  const minS = minScaleRef.current;
  const maxS = minS * 4;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recadrer l&apos;avatar</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Glissez pour repositionner, utilisez le curseur pour zoomer.
        </p>

        <div
          className="relative mx-auto rounded-full overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing select-none"
          style={{ width: VIEWPORT, height: VIEWPORT, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="absolute top-0 left-0 max-w-none pointer-events-none"
              style={{
                width:           img.width,
                height:          img.height,
                transform:       `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}
          <div className="absolute inset-0 ring-2 ring-white/70 rounded-full pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <ZoomOut className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="range"
            aria-label="Zoom"
            min={minS}
            max={maxS}
            step={0.01}
            value={scale}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <ZoomIn className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white/60 text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !img}
            className={cn(
              'flex-1 h-10 rounded-xl bg-brand-500 text-white text-sm font-medium',
              'shadow-[0_4px_14px_rgba(13,148,136,0.35)]',
              'hover:bg-brand-600 transition-colors',
              (busy || !img) && 'opacity-70 cursor-wait',
              'inline-flex items-center justify-center gap-1.5',
            )}
          >
            {busy
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Check className="w-3.5 h-3.5" />}
            {busy ? 'Téléversement…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
