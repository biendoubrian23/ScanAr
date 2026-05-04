'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      containerClassName,
      labelClassName,
      inputClassName,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = rest.id ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName, className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-zinc-300',
              disabled && 'opacity-50 cursor-not-allowed',
              labelClassName,
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                'text-zinc-500 pointer-events-none',
                'flex items-center justify-center w-4 h-4',
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              // Base
              'w-full h-10 rounded-xl text-sm',
              'bg-white/5 text-zinc-100 placeholder:text-zinc-600',
              'border border-white/10',
              'transition-all duration-200',
              // Focus
              'focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20',
              // Hover
              'hover:border-white/20 hover:bg-white/[0.07]',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Error
              hasError && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20',
              // Icon padding
              icon ? 'pl-9 pr-4' : 'px-4',
              inputClassName,
            )}
            {...rest}
          />
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-red-400"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-zinc-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
