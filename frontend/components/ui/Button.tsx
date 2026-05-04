'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

interface ButtonWithClick extends BaseButtonProps {
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

interface ButtonWithHref extends BaseButtonProps {
  href: string;
  onClick?: never;
  type?: never;
}

type ButtonProps = ButtonWithClick | ButtonWithHref;

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-brand-500',
    'text-white',
    'shadow-sm',
    'hover:bg-brand-600',
    'active:bg-brand-700',
    'border border-brand-500',
  ].join(' '),

  secondary: [
    'bg-white',
    'text-gray-700',
    'border border-gray-200',
    'shadow-sm',
    'hover:bg-gray-50',
    'hover:border-gray-300',
    'active:bg-gray-100',
  ].join(' '),

  danger: [
    'bg-red-500',
    'text-white',
    'shadow-sm',
    'hover:bg-red-600',
    'active:bg-red-700',
    'border border-red-500',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-gray-600',
    'border border-transparent',
    'hover:bg-gray-100',
    'hover:text-gray-900',
    'active:bg-gray-200',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

const baseStyles = [
  'inline-flex items-center justify-center',
  'font-medium',
  'transition-all duration-200',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-brand-500',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-white',
  'select-none',
  'whitespace-nowrap',
].join(' ');

const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

// ─── Component ────────────────────────────────────────────────────────────────

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    children,
  } = props;

  const isDisabled = disabled || loading;

  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    isDisabled && disabledStyles,
    className,
  );

  const content = (
    <>
      {loading && (
        <Loader2
          className={cn(
            'animate-spin shrink-0',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { onClick, type = 'button' } = props as ButtonWithClick;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      title={props.title}
      aria-disabled={isDisabled || undefined}
    >
      {content}
    </button>
  );
}

export default Button;
