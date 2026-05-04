'use client';

import { Box, Trash2, Link2, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDate, formatBytes, cn } from '@/lib/utils';
import type { Model3D } from '@/lib/types';

interface ModelCardProps {
  model: Model3D;
  onDelete: () => void;
  onCreateARLink: () => void;
  deleting?: boolean;
  creatingLink?: boolean;
}

export function ModelCard({
  model,
  onDelete,
  onCreateARLink,
  deleting,
  creatingLink,
}: ModelCardProps) {
  const isProcessing = model.status === 'processing' || model.status === 'pending';
  const isCompleted = model.status === 'completed';

  return (
    <div
      className={cn(
        'glass rounded-2xl overflow-hidden',
        'transition-shadow duration-200',
        'hover:shadow-lg hover:shadow-black/30',
      )}
    >
      {/* Image preview */}
      <div className="relative h-44 bg-dark-900 overflow-hidden">
        {model.image_url ? (
          <img
            src={model.image_url}
            alt={model.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Box className="w-10 h-10 text-zinc-700" />
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-3 right-3">
          <Badge status={model.status} />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <div className="w-3/4">
              <ProgressBar value={model.progress} showPercent color="brand" />
            </div>
            <p className="text-xs text-zinc-400">
              {model.status === 'pending' ? 'Queued...' : 'Processing...'}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 truncate">
            {model.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>{formatDate(model.created_at)}</span>
            {model.file_size_bytes && (
              <>
                <span className="text-zinc-700">&middot;</span>
                <span>{formatBytes(model.file_size_bytes)}</span>
              </>
            )}
          </div>
        </div>

        {model.error_message && (
          <p className="text-xs text-red-400 line-clamp-2">{model.error_message}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {isCompleted && (
            <>
              <button
                onClick={onCreateARLink}
                disabled={creatingLink}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                  'bg-brand-600/20 text-brand-300 border border-brand-500/30',
                  'hover:bg-brand-600/30 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {creatingLink ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Link2 className="w-3 h-3" />
                )}
                AR Link
              </button>

              {model.glb_url && (
                <a
                  href={model.glb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg',
                    'text-zinc-500 hover:text-zinc-200',
                    'hover:bg-white/8 transition-colors',
                  )}
                  title="Preview 3D model"
                >
                  <Eye className="w-3.5 h-3.5" />
                </a>
              )}
            </>
          )}

          <button
            onClick={onDelete}
            disabled={deleting}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg ml-auto',
              'text-zinc-500 hover:text-red-400',
              'hover:bg-red-500/10 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            title="Delete model"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModelCard;
