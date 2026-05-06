'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Catalogue } from '@/lib/types';

interface AvatarUploaderProps {
  catalogueId: string;
  avatarUrl:   string | null;
  onChange:    (cat: Catalogue) => void;
  onError:     (msg: string) => void;
}

const MAX_BYTES   = 3 * 1024 * 1024;
const OUTPUT_SIZE = 512;

export function AvatarUploader({
  catalogueId, avatarUrl, onChange, onError,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      onError('Fichier trop lourd (max 3 MB).');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Format non supporté (JPG, PNG ou WebP).');
      return;
    }

    setBusy('upload');
    try {
      const cropped = await squareCropToBlob(file, OUTPUT_SIZE);
      const fd = new FormData();
      fd.append('file', cropped, `avatar.${cropped.type === 'image/png' ? 'png' : 'webp'}`);

      const res  = await fetch(`/api/catalogues/${catalogueId}/avatar`, { method: 'POST', body: fd });
      const body = await res.json();
      if (!body.success) throw new Error(body.error ?? 'Upload échoué.');
      onChange(body.data as Catalogue);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur upload.');
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setBusy('remove');
    try {
      const res  = await fetch(`/api/catalogues/${catalogueId}/avatar`, { method: 'DELETE' });
      const body = await res.json();
      if (!body.success) throw new Error(body.error ?? 'Suppression échouée.');
      onChange(body.data as Catalogue);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur suppression.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={pickFile}
        disabled={busy !== null}
        className={cn(
          'relative w-24 h-24 rounded-full overflow-hidden shrink-0',
          'border-2 border-dashed border-gray-300 hover:border-brand-500',
          'bg-gray-50 group transition-colors',
          busy && 'opacity-70 cursor-wait',
        )}
        aria-label="Changer l'avatar"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User className="w-8 h-8" />
          </div>
        )}

        <span className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity',
        )}>
          {busy === 'upload'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Camera className="w-5 h-5" />
          }
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Avatar du catalogue</p>
        <p className="text-xs text-gray-500 mt-0.5">
          JPG, PNG ou WebP — max 3 MB. Recadré en carré.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={pickFile}
            disabled={busy !== null}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium',
              'bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors',
              busy && 'opacity-70 cursor-wait',
            )}
          >
            <Camera className="w-3.5 h-3.5" />
            {avatarUrl ? 'Changer' : 'Téléverser'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== null}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium',
                'text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors',
                busy && 'opacity-70 cursor-wait',
              )}
            >
              {busy === 'remove'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Retirer
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
    </div>
  );
}

// ─── Client-side square center-crop + downscale via canvas ───────────────────
async function squareCropToBlob(file: File, size: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const side = Math.min(img.width, img.height);
    const sx   = (img.width  - side) / 2;
    const sy   = (img.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non supporté.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    // PNG preserves transparency; WebP is smaller. Use WebP when source isn't PNG.
    const mime    = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const quality = mime === 'image/webp' ? 0.9 : undefined;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, quality),
    );
    if (!blob) throw new Error('Conversion échouée.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible.'));
    img.src = src;
  });
}
