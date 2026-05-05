'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  /** Callback fired with all newly accepted files (1..maxFiles items). */
  onFilesAccepted: (files: File[]) => void;
  /** Maximum total files the parent currently accepts (already-selected included). */
  maxFiles?: number;
  /** How many files the parent already holds — used to compute remaining slots. */
  currentCount?: number;
  disabled?: boolean;
  className?: string;
}

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 10 * 1024 * 1024;

export function UploadZone({
  onFilesAccepted,
  maxFiles = 4,
  currentCount = 0,
  disabled,
  className,
}: UploadZoneProps) {
  const remaining = Math.max(0, maxFiles - currentCount);
  const isFull = remaining === 0;

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFilesAccepted(accepted);
    },
    [onFilesAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    maxFiles: remaining,
    disabled: disabled || isFull,
    multiple: maxFiles > 1,
  });

  const rejection = fileRejections[0]?.errors[0];
  let errorMsg: string | null = null;
  if (rejection) {
    if (rejection.code === 'file-too-large')         errorMsg = 'Un fichier dépasse la limite de 10 Mo';
    else if (rejection.code === 'file-invalid-type') errorMsg = 'Seuls les formats JPG, PNG et WebP sont acceptés';
    else if (rejection.code === 'too-many-files')    errorMsg = `Maximum ${maxFiles} images au total`;
    else                                              errorMsg = rejection.message;
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2.5',
          'w-full min-h-[140px] rounded-xl',
          'border-2 border-dashed',
          'transition-all duration-150 cursor-pointer group',
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/30',
          (disabled || isFull) && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-150',
            isDragActive
              ? 'bg-brand-100 text-brand-600'
              : 'bg-white border border-gray-200 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-500 group-hover:border-brand-200',
          )}
        >
          {isDragActive ? <Upload className="w-5 h-5" /> : <ImagePlus className="w-5 h-5" />}
        </div>

        <div className="text-center">
          {isFull ? (
            <p className="text-sm text-gray-500">
              Limite atteinte ({maxFiles} images max)
            </p>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-brand-600">
              Déposez {remaining > 1 ? 'vos images' : 'votre image'} ici
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-brand-600">Cliquez pour choisir</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPG, PNG ou WebP · 10 Mo max · {currentCount}/{maxFiles} sélectionnées
              </p>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="mt-2 text-xs text-red-600 text-center">{errorMsg}</p>
      )}
    </div>
  );
}

export default UploadZone;
