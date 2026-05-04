'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionsMenuProps {
  items: ActionItem[];
  ariaLabel?: string;
  className?: string;
}

const MENU_WIDTH = 176;       // tailwind w-44
const MENU_GAP   = 4;         // gap between trigger and menu
const VIEWPORT_MARGIN = 8;    // safety margin from viewport edges

/**
 * Petit menu "..." horizontal — utilisé dans les tableaux pour les actions par
 * ligne. Le menu est rendu via un Portal pour éviter d'être tronqué par
 * `overflow-hidden` d'un parent (ex : tableau arrondi).
 */
export function ActionsMenu({ items, ariaLabel = 'Actions', className }: ActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  const [open, setOpen]       = useState(false);
  const [coords, setCoords]   = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Compute menu position whenever it opens or the window resizes/scrolls
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();

      // Estimate height — items*36 + 8 padding
      const estHeight = items.length * 36 + 8;

      // Default: below trigger, right-aligned
      let top  = rect.bottom + MENU_GAP;
      let left = rect.right - MENU_WIDTH;

      // Flip up if not enough space below
      if (top + estHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, rect.top - MENU_GAP - estHeight);
      }
      // Clamp horizontally
      if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
      if (left + MENU_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
        left = window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN;
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, items.length]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t))    return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-md',
          'text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors',
          className,
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && mounted && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            'fixed z-[60] bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden',
          )}
          style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                item.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50',
                item.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default ActionsMenu;
