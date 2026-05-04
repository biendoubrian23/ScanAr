'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { PipelineStepper, PIPELINE_STEPS } from './PipelineStepper';
import { WaterProgressBar } from './WaterProgressBar';
import { cn } from '@/lib/utils';

/**
 * Bottom-right floating widget that follows the user across pages.
 *
 * - Hidden when no active upload/processing model.
 * - Collapsible (header stays visible, body folds).
 * - Shows live pipeline stepper, water-fill progress and a friendly summary.
 * - Auto-dismisses 6s after completion (user can also close manually).
 */
export function FloatingProgressWidget() {
  const { activeModel, phase, isUploading, uploadProgress, uploadError, dismiss } =
    useUploadStore();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-dismiss on success after 15 s — long enough to read all steps.
  useEffect(() => {
    if (phase !== 'completed') return;
    const t = setTimeout(() => dismiss(), 15_000);
    return () => clearTimeout(t);
  }, [phase, dismiss]);

  // Don't render anything when idle and no error
  if (phase === 'idle' && !uploadError) return null;

  // Compute current displayed progress
  const progress = isUploading
    ? Math.round(uploadProgress * 0.1) // upload accounts for ~10% of overall pipeline
    : activeModel?.progress ?? 0;

  // Friendly title
  const title = (() => {
    if (uploadError && !activeModel) return "Échec de l'envoi";
    if (phase === 'uploading')  return 'Envoi en cours…';
    if (phase === 'processing') return 'Génération 3D…';
    if (phase === 'completed')  return 'Modèle prêt !';
    if (phase === 'failed')     return 'Génération échouée';
    return 'Traitement…';
  })();

  const subtitle = (() => {
    if (uploadError && !activeModel) return uploadError;
    if (!activeModel && isUploading) return "Envoi de l'image vers le stockage";
    if (!activeModel) return '';

    if (phase === 'failed') {
      const failedStep = activeModel.steps_log?.find((e) => e.status === 'failed');
      const stepLabel = failedStep
        ? PIPELINE_STEPS.find((s) => s.id === failedStep.step)?.label ?? failedStep.step
        : null;
      return stepLabel
        ? `Failed at "${stepLabel}"${failedStep?.message ? `: ${failedStep.message}` : ''}`
        : (activeModel.error_message ?? 'Unknown error');
    }

    if (phase === 'completed') return activeModel.name;

    const currentLabel = activeModel.current_step
      ? PIPELINE_STEPS.find((s) => s.id === activeModel.current_step)?.label
      : null;
    return currentLabel ? `Step: ${currentLabel}` : activeModel.name;
  })();

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-[340px] max-w-[calc(100vw-2rem)]',
        'bg-white border border-gray-200 rounded-xl shadow-xl',
        'animate-[slide-in_240ms_ease-out]',
      )}
      role="region"
      aria-label="Pipeline progress"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <div className="shrink-0">
          {phase === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {phase === 'failed'    && <AlertCircle  className="w-4 h-4 text-red-500" />}
          {(phase === 'uploading' || phase === 'processing') && (
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
          )}
          {uploadError && !activeModel && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</p>
          {subtitle && (
            <p className={cn(
              'text-xs leading-tight truncate mt-0.5',
              phase === 'failed' ? 'text-red-600' : 'text-gray-500',
            )}>
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Déplier' : 'Réduire'}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Water progress bar */}
          <WaterProgressBar
            value={progress}
            failed={phase === 'failed'}
            completed={phase === 'completed'}
          />

          {/* Stepper */}
          <PipelineStepper
            model={activeModel}
            clientUploading={isUploading}
          />

          {/* Action buttons */}
          {phase === 'completed' && activeModel && (
            <Link
              href={`/dashboard/models/${activeModel.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              onClick={dismiss}
            >
              Voir le modèle
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {phase === 'failed' && activeModel?.error_message && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 break-words">
              {activeModel.error_message}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default FloatingProgressWidget;
