'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function UploadZone({ onFileAccepted, disabled, className }: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFileAccepted(accepted[0]);
      }
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
    multiple: false,
  });

  const rejection = fileRejections[0]?.errors[0];
  let errorMsg: string | null = null;
  if (rejection) {
    if (rejection.code === 'file-too-large') errorMsg = 'File exceeds 10 MB limit';
    else if (rejection.code === 'file-invalid-type') errorMsg = 'Only JPG, PNG and WebP are accepted';
    else errorMsg = rejection.message;
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3',
          'w-full min-h-[160px] rounded-2xl',
          'border-2 border-dashed',
          'transition-all duration-200 cursor-pointer',
          'group',
          isDragActive
            ? 'border-brand-500/60 bg-brand-600/10'
            : 'border-white/15 bg-white/[0.02] hover:border-brand-500/40 hover:bg-brand-600/5',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-2xl',
            'transition-colors duration-200',
            isDragActive
              ? 'bg-brand-600/25 border border-brand-500/40'
              : 'bg-white/5 border border-white/10 group-hover:bg-brand-600/15 group-hover:border-brand-500/30',
          )}
        >
          {isDragActive ? (
            <Upload className="w-6 h-6 text-brand-400" />
          ) : (
            <ImagePlus className="w-6 h-6 text-zinc-500 group-hover:text-brand-400 transition-colors" />
          )}
        </div>

        <div className="text-center">
          {isDragActive ? (
            <p className="text-sm font-medium text-brand-300">Drop your image here</p>
          ) : (
            <>
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-brand-400">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                JPG, PNG or WebP &middot; Max 10 MB
              </p>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="mt-2 text-xs text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}

export default UploadZone;
