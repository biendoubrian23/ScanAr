'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** 0..100 */
  value: number;
  /** show percentage label inside */
  showPercent?: boolean;
  /** display height */
  height?: number;
  /** failed visual state — switches to red */
  failed?: boolean;
  /** completed state — switches to emerald + stops the wave */
  completed?: boolean;
  className?: string;
}

/**
 * Water-fill progress bar:
 *  - the filled area uses an animated <svg> wave for a "rising water" feel
 *  - graceful fallback to flat fill if reduced motion is requested
 */
export function WaterProgressBar({
  value,
  showPercent = true,
  height = 26,
  failed = false,
  completed = false,
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));

  const bgColor   = failed ? 'bg-red-50' : completed ? 'bg-emerald-50' : 'bg-brand-50';
  const fillColor = failed ? '#ef4444'   : completed ? '#10b981'       : '#5e6ad2';
  const textColor = failed ? 'text-red-700' : completed ? 'text-emerald-700' : 'text-gray-800';

  return (
    <div
      className={cn('relative w-full rounded-lg overflow-hidden border border-gray-200', bgColor, className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Filled area (water) */}
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      >
        {/* Animated wave on top of fill */}
        {!completed && !failed && clamped > 0 && clamped < 100 && (
          <svg
            className="absolute -top-2 left-0 w-[200%] h-3 wave-anim"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 6 Q 25 0, 50 6 T 100 6 T 150 6 T 200 6 V 12 H 0 Z"
              fill={fillColor}
              opacity="0.85"
            />
          </svg>
        )}
        <div className="absolute inset-0" style={{ background: fillColor }} />
      </div>

      {/* Percentage label */}
      {showPercent && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums z-10',
          textColor,
        )}>
          {Math.round(clamped)}%
        </div>
      )}

      <style jsx>{`
        :global(.wave-anim) {
          animation: wave-move 3s linear infinite;
        }
        @keyframes wave-move {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.wave-anim) { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default WaterProgressBar;
