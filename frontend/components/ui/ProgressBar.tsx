import React from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressColor = 'brand' | 'green' | 'red' | 'yellow' | 'blue';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercent?: boolean;
  color?: ProgressColor;
  className?: string;
  trackClassName?: string;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const fillStyles: Record<ProgressColor, string> = {
  brand:  'bg-brand-500',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  yellow: 'bg-amber-500',
  blue:   'bg-sky-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  label,
  showPercent = false,
  color = 'brand',
  className,
  trackClassName,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {/* Label row */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-gray-500">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-medium text-gray-700 tabular-nums ml-auto">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={cn(
          'relative w-full h-2 rounded-full overflow-hidden bg-gray-100',
          trackClassName,
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            fillStyles[color],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
