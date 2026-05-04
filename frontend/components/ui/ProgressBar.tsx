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
  brand: 'bg-gradient-to-r from-brand-600 to-brand-400',
  green: 'bg-gradient-to-r from-green-600 to-green-400',
  red: 'bg-gradient-to-r from-red-600 to-red-400',
  yellow: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
  blue: 'bg-gradient-to-r from-blue-600 to-blue-400',
};

const glowStyles: Record<ProgressColor, string> = {
  brand: 'shadow-brand-500/50',
  green: 'shadow-green-500/50',
  red: 'shadow-red-500/50',
  yellow: 'shadow-yellow-500/50',
  blue: 'shadow-blue-500/50',
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
            <span className="text-xs font-medium text-zinc-400">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-medium text-zinc-300 tabular-nums ml-auto">
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
          'relative w-full h-2 rounded-full overflow-hidden',
          'bg-white/8',
          trackClassName,
        )}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full',
            'transition-[width] duration-500 ease-out',
            fillStyles[color],
            clamped > 0 && `shadow-sm ${glowStyles[color]}`,
          )}
          style={{ width: `${clamped}%` }}
        />

        {/* Shimmer overlay when in progress */}
        {clamped > 0 && clamped < 100 && (
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              'bg-gradient-to-r from-transparent via-white/20 to-transparent',
              'animate-shimmer bg-[length:200%_100%]',
            )}
            style={{ width: `${clamped}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
