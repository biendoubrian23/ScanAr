'use client';

import { cn } from '@/lib/utils';

interface IPhoneFrameProps {
  children:    React.ReactNode;
  className?:  string;
  /** Inner viewport width in px (default 390 — iPhone 14/15 logical width). */
  viewportWidth?:  number;
  /** Inner viewport height in px (default 844). */
  viewportHeight?: number;
}

/**
 * Lightweight iPhone bezel for previewing a catalogue at phone dimensions.
 * The inner area is a scrollable viewport that exactly matches a real
 * mobile viewport in width — useful for sanity-checking responsive layout.
 */
export function IPhoneFrame({
  children,
  className,
  viewportWidth  = 390,
  viewportHeight = 844,
}: IPhoneFrameProps) {
  return (
    <div
      className={cn('relative mx-auto', className)}
      style={{ width: viewportWidth + 24 }}
    >
      {/* Outer bezel */}
      <div
        className="relative rounded-[3rem] bg-black shadow-2xl ring-1 ring-black/10"
        style={{ padding: 12 }}
      >
        {/* Screen */}
        <div
          className="relative bg-white rounded-[2.4rem] overflow-hidden"
          style={{ width: viewportWidth, height: viewportHeight }}
        >
          {/* Notch (Dynamic Island style pill) */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full bg-black"
            style={{ width: 110, height: 30 }}
            aria-hidden="true"
          />

          {/* Scroll viewport — scrollbar intentionally hidden */}
          <div
            className="absolute inset-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {children}
          </div>
        </div>

        {/* Side buttons (decorative) */}
        <span
          className="absolute -left-[3px] top-[110px] w-[3px] h-8  bg-zinc-700 rounded-l-sm"
          aria-hidden="true"
        />
        <span
          className="absolute -left-[3px] top-[170px] w-[3px] h-14 bg-zinc-700 rounded-l-sm"
          aria-hidden="true"
        />
        <span
          className="absolute -left-[3px] top-[240px] w-[3px] h-14 bg-zinc-700 rounded-l-sm"
          aria-hidden="true"
        />
        <span
          className="absolute -right-[3px] top-[160px] w-[3px] h-20 bg-zinc-700 rounded-r-sm"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
