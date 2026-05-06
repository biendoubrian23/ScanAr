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
              'text-sm font-medium text-gray-700',
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
                'text-gray-400 pointer-events-none',
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
              'w-full h-9 rounded-full text-sm',
              'bg-white/40 backdrop-blur-md text-gray-900 placeholder:text-gray-400',
              'border border-white/60',
              'shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
              'transition-all duration-150',
              'focus:outline-none focus:border-brand-400/50 focus:ring-2 focus:ring-brand-500/15 focus:bg-white/55',
              'hover:border-white/80 hover:bg-white/50',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50/60',
              hasError && 'border-red-400/60 focus:border-red-500/60 focus:ring-red-500/15',
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
            className="flex items-center gap-1.5 text-xs text-red-600"
          >
            <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
