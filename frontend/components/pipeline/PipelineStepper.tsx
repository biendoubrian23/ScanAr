'use client';

import React from 'react';
import { Check, Loader2, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Model3D, PipelineStepId } from '@/lib/types';

/**
 * Ordered list of pipeline steps shown to the user.
 * Keep in sync with worker-ai/core/processor.py constants.
 */
export const PIPELINE_STEPS: { id: PipelineStepId; label: string; sublabel: string }[] = [
  { id: 'uploading',          label: 'Upload image',     sublabel: 'Sending to storage' },
  { id: 'queued',             label: 'Queued',           sublabel: 'Waiting for worker' },
  { id: 'downloading_image',  label: 'Fetching image',   sublabel: 'Worker downloads source' },
  { id: 'generating_shape',   label: 'Shape',            sublabel: 'Hunyuan3D — geometry' },
  { id: 'generating_texture', label: 'Texture',          sublabel: 'Hunyuan3D — colors' },
  { id: 'compressing',        label: 'Compress',         sublabel: 'Draco optimization' },
  { id: 'uploading_assets',   label: 'Publish',          sublabel: 'GLB + USDZ to storage' },
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

function stateOf(
  stepId: PipelineStepId,
  current: PipelineStepId | null,
  status: Model3D['status'] | undefined,
  failedStep: PipelineStepId | null,
  clientUploading: boolean,
): StepUiState {
  // Special-case the client upload step
  if (stepId === 'uploading') {
    if (status === 'completed' || status === 'processing') return 'done';
    if (clientUploading) return 'active';
    return current ? 'done' : 'pending';
  }

  if (status === 'completed') return 'done';

  if (status === 'failed') {
    if (failedStep === stepId) return 'failed';
    // Steps before the failed one are done; after are pending
    const order = PIPELINE_STEPS.map((s) => s.id);
    const failedIdx = failedStep ? order.indexOf(failedStep) : -1;
    const idx = order.indexOf(stepId);
    if (failedIdx >= 0 && idx < failedIdx) return 'done';
    return 'pending';
  }

  // Processing
  if (!current) return 'pending';
  const order = PIPELINE_STEPS.map((s) => s.id);
  const currentIdx = order.indexOf(current);
  const idx = order.indexOf(stepId);
  if (idx < currentIdx) return 'done';
  if (idx === currentIdx) return 'active';
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
      {PIPELINE_STEPS.map((step) => (
        <StepRow
          key={step.id}
          label={step.label}
          sublabel={step.sublabel}
          state={stateOf(step.id, current, status, derivedFailed, clientUploading)}
        />
      ))}
    </ul>
  );
}

export default PipelineStepper;
