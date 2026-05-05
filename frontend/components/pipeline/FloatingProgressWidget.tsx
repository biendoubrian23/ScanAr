'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Minus,
} from 'lucide-react';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { PipelineStepper, PIPELINE_STEPS } from './PipelineStepper';
import { WaterProgressBar } from './WaterProgressBar';
import { cn } from '@/lib/utils';

/**
 * Floating progress widget that follows the user across pages.
 *
 * Two visual states:
 *   - **Expanded** — full card (anchored bottom-right, sits visually BEHIND the
 *     mobile bottom navbar via lower z-index so the navbar stays accessible).
 *   - **Minimized** — small circular FAB-style bubble that floats anywhere on
 *     screen and is draggable. Click to re-expand. Position is persisted.
 *
 * Auto-dismisses 15 s after a successful pipeline run.
 */

const STORAGE_KEY = 'scanar:fpw-pos';

interface Pos { x: number; y: number; }

function clampPos(x: number, y: number, size: number): Pos {
  const margin = 8;
  if (typeof window === 'undefined') return { x, y };
  const maxX = window.innerWidth  - size - margin;
  const maxY = window.innerHeight - size - margin;
  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(margin, Math.min(y, maxY)),
  };
}

export function FloatingProgressWidget() {
  const { activeModel, phase, isUploading, uploadProgress, uploadError, dismiss } =
    useUploadStore();

  // Visual state — minimized takes precedence over a regular collapse.
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos]             = useState<Pos | null>(null);

  // Drag tracking (refs to avoid re-renders during the drag)
  const draggingRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const movedRef = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // ── Auto-dismiss on success ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'completed') return;
    const t = setTimeout(() => dismiss(), 15_000);
    return () => clearTimeout(t);
  }, [phase, dismiss]);

  // ── Restore minimized position from localStorage ───────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Pos;
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          setPos(clampPos(parsed.x, parsed.y, 56));
        }
      } catch { /* ignore corrupted entry */ }
    }
  }, []);

  // ── Drag handlers (pointer events handle both mouse and touch) ─────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (!bubbleRef.current) return;
    bubbleRef.current.setPointerCapture(e.pointerId);
    const rect = bubbleRef.current.getBoundingClientRect();
    moveStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: rect.left,
      py: rect.top,
    };
    draggingRef.current = true;
    movedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !moveStartRef.current) return;
    const dx = e.clientX - moveStartRef.current.x;
    const dy = e.clientY - moveStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
    setPos(clampPos(moveStartRef.current.px + dx, moveStartRef.current.py + dy, 56));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!bubbleRef.current) return;
    try { bubbleRef.current.releasePointerCapture(e.pointerId); } catch { /* */ }
    draggingRef.current = false;
    if (pos && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    }
    // If we didn't actually drag, treat as click → expand.
    if (!movedRef.current) setMinimized(false);
  };

  // ── Don't render anything when idle and no error ───────────────────────────
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

  const phaseIcon = (() => {
    if (phase === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (phase === 'failed' || (uploadError && !activeModel)) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />;
  })();

  // ── Minimized — draggable circle bubble ────────────────────────────────────
  if (minimized) {
    // Default position: bottom-right above the mobile navbar (lg has no navbar)
    const stylePos = pos
      ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
      : undefined;

    return (
      <button
        ref={bubbleRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Ouvrir la progression"
        className={cn(
          'fixed z-[60] touch-none select-none',
          // Default anchor when no saved position
          !pos && 'bottom-24 right-4 lg:bottom-6 lg:right-6',
          'w-14 h-14 rounded-full bg-white border border-gray-200 shadow-lg',
          'flex items-center justify-center cursor-grab active:cursor-grabbing',
          'hover:scale-105 transition-transform',
        )}
        style={stylePos}
      >
        {/* Circular progress ring around the icon */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke={phase === 'failed' ? '#ef4444' : phase === 'completed' ? '#10b981' : '#7c3aed'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 24}
            strokeDashoffset={(1 - Math.min(100, Math.max(0, progress)) / 100) * 2 * Math.PI * 24}
            style={{ transition: 'stroke-dashoffset 240ms ease-out' }}
          />
        </svg>
        <span className="relative">{phaseIcon}</span>
      </button>
    );
  }

  // ── Expanded card ──────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        // z-30: BEHIND the mobile bottom navbar (z-40). On desktop, no navbar
        // overlap so it sits as a normal bottom-right widget.
        'fixed z-30',
        // Mobile: lift above the bottom navbar so the entire card is visible.
        'bottom-24 right-3 left-3 sm:left-auto',
        'lg:bottom-4 lg:right-4 lg:left-auto',
        'sm:w-[340px] max-w-[calc(100vw-1.5rem)]',
        'bg-white border border-gray-200 rounded-2xl shadow-xl',
        'animate-[slide-in_240ms_ease-out]',
      )}
      role="region"
      aria-label="Pipeline progress"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <div className="shrink-0">{phaseIcon}</div>
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
          onClick={() => setMinimized(true)}
          aria-label="Réduire en bulle flottante"
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Minus className="w-4 h-4" />
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
      <div className="p-3 space-y-3">
        <WaterProgressBar
          value={progress}
          failed={phase === 'failed'}
          completed={phase === 'completed'}
        />

        <PipelineStepper
          model={activeModel}
          clientUploading={isUploading}
        />

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
