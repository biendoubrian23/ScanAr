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
  /** When true, the text label is hidden on screens < sm (only the colored dot shows). */
  compact?: boolean;
}

interface VariantBadgeProps {
  status?: never;
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

type BadgeProps = StatusBadgeProps | VariantBadgeProps;

// ─── Style Maps ───────────────────────────────────────────────────────────────

const statusStyles: Record<ModelStatus, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  completed:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed:     'bg-red-50 text-red-700 border-red-200',
};

const statusDotStyles: Record<ModelStatus, string> = {
  pending:    'bg-amber-500',
  processing: 'bg-sky-500 animate-pulse',
  completed:  'bg-emerald-500',
  failed:     'bg-red-500',
};

const statusLabels: Record<ModelStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  info:    'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error:   'bg-red-50 text-red-700 border-red-200',
};

const baseStyles =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border';

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge(props: BadgeProps) {
  const { className } = props;

  if ('status' in props && props.status !== undefined) {
    const { status, compact } = props;

    return (
      <span
        className={cn(
          baseStyles,
          statusStyles[status],
          // Compact: shrink to a square dot-only badge below the sm breakpoint.
          compact && 'sm:px-2.5 sm:py-0.5 px-1.5 py-1.5 sm:gap-1.5 gap-0',
          className,
        )}
        role="status"
        aria-label={`Status: ${statusLabels[status]}`}
      >
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDotStyles[status])}
          aria-hidden="true"
        />
        <span className={cn(compact && 'hidden sm:inline')}>{statusLabels[status]}</span>
      </span>
    );
  }

  const { variant = 'default', children, compact } = props as VariantBadgeProps;

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        compact && 'sm:px-2.5 px-1.5',
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
