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
  const isCompleted  = model.status === 'completed';

  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/45 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all duration-200 overflow-hidden">
      {/* Image preview */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {model.image_url ? (
          <img src={model.image_url} alt={model.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Box className="w-10 h-10 text-gray-300" />
          </div>
        )}

        <div className="absolute top-2 right-2">
          <Badge status={model.status} />
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 px-4">
            <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
            <div className="w-full max-w-[180px]">
              <ProgressBar value={model.progress} showPercent color="brand" />
            </div>
            <p className="text-xs text-gray-600">
              {model.status === 'pending' ? 'Queued…' : 'Processing…'}
            </p>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">{model.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
            <span>{formatDate(model.created_at)}</span>
            {model.file_size_bytes && (
              <>
                <span className="text-gray-300">·</span>
                <span>{formatBytes(model.file_size_bytes)}</span>
              </>
            )}
          </div>
        </div>

        {model.error_message && (
          <p className="text-xs text-red-600 line-clamp-2">{model.error_message}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isCompleted && (
            <>
              <button
                onClick={onCreateARLink}
                disabled={creatingLink}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'bg-brand-500/10 text-brand-700 shadow-[0_2px_6px_rgba(13,148,136,0.12)]',
                  'hover:bg-brand-500/18 transition-all duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {creatingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                AR Link
              </button>

              {model.glb_url && (
                <a
                  href={model.glb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70 transition-all duration-150"
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
              'flex items-center justify-center w-7 h-7 rounded-full ml-auto',
              'text-gray-400 hover:text-red-600 hover:bg-red-50/60 transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            title="Delete model"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModelCard;
