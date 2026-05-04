'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

// ─── Animation Variants ───────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative w-full',
              sizeStyles[size],
              'bg-dark-900/90 backdrop-blur-xl',
              'border border-white/10',
              'rounded-2xl shadow-2xl shadow-black/50',
              className,
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-zinc-100 leading-snug"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg',
                    'text-zinc-500 hover:text-zinc-200',
                    'hover:bg-white/8',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  )}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Close button when no title */}
            {!title && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className={cn(
                  'absolute top-4 right-4',
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'text-zinc-500 hover:text-zinc-200',
                  'hover:bg-white/8',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                )}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
