import React from 'react';
import { cn } from '@/lib/utils';
import type { Model3D } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModelStatus = Model3D['status'];
type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

interface StatusBadgeProps {
  status: ModelStatus;
  variant?: never;
  children?: never;
  className?: string;
}

interface VariantBadgeProps {
  status?: never;
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

type BadgeProps = StatusBadgeProps | VariantBadgeProps;

// ─── Style Maps ───────────────────────────────────────────────────────────────

const statusStyles: Record<ModelStatus, string> = {
  pending:
    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 ring-yellow-500/20',
  processing:
    'bg-blue-500/15 text-blue-300 border-blue-500/30 ring-blue-500/20 animate-pulse',
  completed:
    'bg-green-500/15 text-green-300 border-green-500/30 ring-green-500/20',
  failed:
    'bg-red-500/15 text-red-300 border-red-500/30 ring-red-500/20',
};

const statusDotStyles: Record<ModelStatus, string> = {
  pending: 'bg-yellow-400',
  processing: 'bg-blue-400 animate-pulse',
  completed: 'bg-green-400',
  failed: 'bg-red-400',
};

const statusLabels: Record<ModelStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-zinc-300 border-white/15',
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  success: 'bg-green-500/15 text-green-300 border-green-500/30',
  warning: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  error: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const baseStyles =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border';

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge(props: BadgeProps) {
  const { className } = props;

  if ('status' in props && props.status !== undefined) {
    const { status } = props;

    return (
      <span
        className={cn(baseStyles, statusStyles[status], className)}
        role="status"
        aria-label={`Status: ${statusLabels[status]}`}
      >
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDotStyles[status])}
          aria-hidden="true"
        />
        {statusLabels[status]}
      </span>
    );
  }

  const { variant = 'default', children } = props as VariantBadgeProps;

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </span>
  );
}

export default Badge;
