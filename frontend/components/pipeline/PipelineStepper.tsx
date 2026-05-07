'use client';

import React from 'react';
import { Check, Loader2, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Model3D, PipelineStepId } from '@/lib/types';

/**
 * Ordered list of pipeline steps reported by the backend.
 * Keep in sync with worker-ai/core/processor.py constants.
 * Used elsewhere (e.g. FloatingProgressWidget) to map a current_step id to a
 * human label. The visible stepper groups these into PIPELINE_GROUPS below.
 */
export const PIPELINE_STEPS: { id: PipelineStepId; label: string; sublabel: string }[] = [
  { id: 'uploading',          label: 'Upload image',      sublabel: 'Sending to storage' },
  { id: 'queued',             label: 'Queued',            sublabel: 'Waiting for worker' },
  { id: 'downloading_image',  label: 'Fetching image',    sublabel: 'Worker downloads source' },
  { id: 'enhancing_image',    label: 'Amélioration IA',   sublabel: 'gpt-image-1 — nettoyage & fond' },
  { id: 'completing_views',   label: 'Vues manquantes',   sublabel: 'gpt-4o + gpt-image-1 — angles' },
  { id: 'generating_shape',   label: 'Shape',             sublabel: 'Hunyuan3D — geometry' },
  { id: 'generating_texture', label: 'Texture',           sublabel: 'Hunyuan3D — colors' },
  { id: 'cleaning_mesh',      label: 'Nettoyage mesh',    sublabel: 'Outliers + lissage Taubin' },
  { id: 'compressing',        label: 'Compress',          sublabel: 'Draco optimization' },
  { id: 'uploading_assets',   label: 'Publish',           sublabel: 'GLB + USDZ to storage' },
];

/**
 * High-level groups shown to the user. Each group bundles several backend
 * step ids into a single visible row. The backend pipeline itself is unchanged.
 */
const PIPELINE_GROUPS: {
  label: string;
  sublabel: string;
  steps: PipelineStepId[];
}[] = [
  {
    label: 'Préparation',
    sublabel: "Envoi & récupération de l'image",
    steps: ['uploading', 'queued', 'downloading_image'],
  },
  {
    label: 'Amélioration IA',
    sublabel: 'Nettoyage, fond & vues manquantes',
    steps: ['enhancing_image', 'completing_views'],
  },
  {
    label: 'Génération 3D',
    sublabel: 'Hunyuan3D — geometry, texture & mesh',
    steps: ['generating_shape', 'generating_texture', 'cleaning_mesh'],
  },
  {
    label: 'Publication',
    sublabel: 'Compression & stockage',
    steps: ['compressing', 'uploading_assets'],
  },
];

type StepUiState = 'pending' | 'active' | 'done' | 'failed';

interface Props {
  model: Model3D | null;
  /** When true, also include the client-side "uploading" step at index 0 */
  includeClientUpload?: boolean;
  /** when phase==='uploading' on the client */
  clientUploading?: boolean;
  /** when phase==='failed' the step at which it failed */
  failedStep?: PipelineStepId | null;
  className?: string;
}

function groupStateOf(
  groupIdx: number,
  current: PipelineStepId | null,
  status: Model3D['status'] | undefined,
  failedStep: PipelineStepId | null,
  clientUploading: boolean,
): StepUiState {
  const group = PIPELINE_GROUPS[groupIdx];
  const order = PIPELINE_STEPS.map((s) => s.id);
  const groupStepIdxs = group.steps.map((id) => order.indexOf(id));
  const groupStart = Math.min(...groupStepIdxs);
  const groupEnd   = Math.max(...groupStepIdxs);

  // Client-side upload is the very first backend step ('uploading') and lives
  // in the first group. Surface it as active before the worker takes over.
  if (clientUploading && groupIdx === 0 && status !== 'completed' && status !== 'failed') {
    return 'active';
  }

  if (status === 'completed') return 'done';

  if (status === 'failed') {
    const failedIdx = failedStep ? order.indexOf(failedStep) : -1;
    if (failedIdx < 0) return groupIdx === 0 ? 'failed' : 'pending';
    if (failedIdx > groupEnd) return 'done';
    if (failedIdx >= groupStart) return 'failed';
    return 'pending';
  }

  // Processing (or pending with no current step yet)
  if (!current) return groupIdx === 0 ? 'pending' : 'pending';
  const currentIdx = order.indexOf(current);
  if (currentIdx > groupEnd)  return 'done';
  if (currentIdx >= groupStart) return 'active';
  return 'pending';
}

function StepRow({
  label,
  sublabel,
  state,
}: {
  label: string;
  sublabel: string;
  state: StepUiState;
}) {
  return (
    <li className="flex items-start gap-3 py-1.5">
      <div
        className={cn(
          'flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 transition-colors',
          state === 'done'    && 'bg-emerald-500 text-white',
          state === 'active'  && 'bg-brand-500 text-white',
          state === 'failed'  && 'bg-red-500 text-white',
          state === 'pending' && 'bg-gray-100 text-gray-400 border border-gray-200',
        )}
      >
        {state === 'done'    && <Check    className="w-3 h-3" strokeWidth={3} />}
        {state === 'active'  && <Loader2  className="w-3 h-3 animate-spin" strokeWidth={3} />}
        {state === 'failed'  && <X        className="w-3 h-3" strokeWidth={3} />}
        {state === 'pending' && <Circle   className="w-2 h-2 fill-current" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-tight font-medium',
          state === 'pending' ? 'text-gray-400' : 'text-gray-800',
          state === 'active'  && 'text-brand-600',
          state === 'failed'  && 'text-red-600',
        )}>
          {label}
        </p>
        <p className={cn(
          'text-xs leading-tight mt-0.5',
          state === 'pending' ? 'text-gray-300' : 'text-gray-500',
        )}>
          {sublabel}
        </p>
      </div>
    </li>
  );
}

export function PipelineStepper({
  model,
  clientUploading = false,
  failedStep = null,
  className,
}: Props) {
  const current = model?.current_step ?? null;
  const status = model?.status;

  // Derive failed step from the model's log if not explicitly passed
  const derivedFailed: PipelineStepId | null =
    failedStep ??
    (model?.steps_log?.find((e) => e.status === 'failed')?.step ?? null);

  return (
    <ul className={cn('space-y-0.5', className)}>
      {PIPELINE_GROUPS.map((group, idx) => (
        <StepRow
          key={group.label}
          label={group.label}
          sublabel={group.sublabel}
          state={groupStateOf(idx, current, status, derivedFailed, clientUploading)}
        />
      ))}
    </ul>
  );
}

export default PipelineStepper;
