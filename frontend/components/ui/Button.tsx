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
    'bg-gradient-to-r from-brand-600 to-brand-500',
    'text-white',
    'shadow-lg shadow-brand-600/30',
    'hover:from-brand-500 hover:to-brand-400',
    'hover:shadow-brand-500/40',
    'active:from-brand-700 active:to-brand-600',
    'border border-brand-500/30',
  ].join(' '),

  secondary: [
    'bg-white/5',
    'backdrop-blur-md',
    'text-zinc-200',
    'border border-white/10',
    'hover:bg-white/10',
    'hover:border-white/20',
    'hover:text-white',
    'active:bg-white/5',
  ].join(' '),

  danger: [
    'bg-gradient-to-r from-red-600 to-red-500',
    'text-white',
    'shadow-lg shadow-red-600/25',
    'hover:from-red-500 hover:to-red-400',
    'hover:shadow-red-500/35',
    'active:from-red-700 active:to-red-600',
    'border border-red-500/30',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-zinc-400',
    'border border-transparent',
    'hover:bg-white/5',
    'hover:text-zinc-200',
    'hover:border-white/10',
    'active:bg-white/5',
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
  'focus-visible:ring-offset-dark-950',
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
