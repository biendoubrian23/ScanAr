'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** 0..100 */
  value: number;
  showPercent?: boolean;
  height?: number;
  failed?: boolean;
  completed?: boolean;
  className?: string;
}

export function WaterProgressBar({
  value,
  showPercent = true,
  height = 30,
  failed = false,
  completed = false,
  className,
}: Props) {
  const clamped  = Math.max(0, Math.min(100, value));
  const isActive = !failed && !completed && clamped > 0 && clamped < 100;

  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden',
        failed    ? 'bg-red-100'     :
        completed ? 'bg-emerald-100' :
                    'bg-slate-100',
        className,
      )}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* ── Fill ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-xl transition-[width] duration-700 ease-out overflow-hidden',
          failed    ? 'bg-gradient-to-r from-red-500 to-red-400'         :
          completed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      'fill-gradient',
        )}
        style={{ width: `${clamped}%` }}
      >
        {/* Shimmer streak — diagonal bright line sweeping left → right */}
        {isActive && <div className="shimmer absolute inset-0" aria-hidden="true" />}

        {/* Leading-edge glow — white radial glow that pulses at the tip */}
        {isActive && (
          <div
            className="absolute inset-y-0 right-0 w-6 leading-glow"
            aria-hidden="true"
          />
        )}
      </div>

      {/* ── Label ────────────────────────────────────────────────────── */}
      {showPercent && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span
            className={cn(
              'text-xs font-bold tabular-nums select-none',
              clamped > 52
                ? 'text-white'
                : failed
                ? 'text-red-700'
                : completed
                ? 'text-emerald-700'
                : 'text-indigo-700',
            )}
          >
            {completed ? '✓  100%' : `${Math.round(clamped)}%`}
          </span>
        </div>
      )}

      {/* ── CSS animations ───────────────────────────────────────────── */}
      <style jsx>{`
        /* Animated gradient fill — hue slowly shifts while loading */
        .fill-gradient {
          background: linear-gradient(
            90deg,
            #6366f1 0%,
            #8b5cf6 40%,
            #a78bfa 60%,
            #6366f1 100%
          );
          background-size: 250% 100%;
          animation: gradient-slide 3s linear infinite;
        }

        /* Shimmer — a bright diagonal streak that sweeps across */
        .shimmer {
          background: linear-gradient(
            110deg,
            transparent 30%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 70%
          );
          background-size: 250% 100%;
          animation: shimmer-sweep 2s ease-in-out infinite;
        }

        /* Glowing dot at the leading edge */
        .leading-glow {
          background: radial-gradient(
            ellipse at right center,
            rgba(255, 255, 255, 0.75) 0%,
            transparent 75%
          );
          animation: glow-pulse 1.1s ease-in-out infinite;
        }

        @keyframes gradient-slide {
          0%   { background-position: 0%   50%; }
          100% { background-position: 250% 50%; }
        }
        @keyframes shimmer-sweep {
          0%   { background-position: -150% 0; }
          100% { background-position: 250% 0;  }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }

        @media (prefers-reduced-motion: reduce) {
          .fill-gradient  { animation: none; }
          .shimmer        { animation: none; background: none; }
          .leading-glow   { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default WaterProgressBar;
