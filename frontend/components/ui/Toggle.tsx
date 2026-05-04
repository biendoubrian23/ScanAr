'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  size?: 'sm' | 'md';
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  size = 'md',
}: ToggleProps) {
  const dims = size === 'sm'
    ? { track: 'h-4 w-7', thumb: 'h-3 w-3', on: 14, off: 2 }
    : { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', on: 18, off: 2 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        dims.track,
        checked ? 'bg-brand-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn('inline-block rounded-full bg-white shadow transition-transform duration-200', dims.thumb)}
        style={{ transform: `translateX(${checked ? dims.on : dims.off}px)` }}
      />
    </button>
  );
}

export default Toggle;
