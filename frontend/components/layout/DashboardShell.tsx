'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from '@/lib/stores/mobileSidebarStore';

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Page-level wrapper. Renders the page header (title/subtitle/action) + main
 * content. The Sidebar is mounted ONCE at the dashboard layout level so it
 * persists across navigation — do NOT include it here.
 */
export function DashboardShell({
  children,
  title,
  subtitle,
  action,
  className,
}: DashboardShellProps) {
  const { open: openSidebar } = useMobileSidebar();
  return (
    <>
      {/* Page header — fixed h-[81px] so the bottom border lines up exactly
          with the sidebar logo divider (same fixed height there). */}
      <header
        className={cn(
          'flex items-center gap-3 shrink-0',
          'px-4 lg:px-8 h-[81px] border-b border-gray-200 bg-white',
        )}
      >
        {/* Mobile burger — integrated into the header layout (no overlap). */}
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Ouvrir la barre latérale"
          className={cn(
            'lg:hidden inline-flex items-center justify-center shrink-0',
            'w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm',
            'text-gray-700 hover:bg-gray-50 active:scale-95 transition-all',
          )}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      {/* Content — full width, no max constraint so the layout breathes on
          large screens. Pages can still wrap individual sections if needed. */}
      <main
        className={cn(
          'flex-1 overflow-y-auto px-6 lg:px-8 py-6 scrollbar-thin',
          // Reserve space for the floating mobile bottom nav (h-16 + margins)
          'pb-28 lg:pb-6',
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}

export default DashboardShell;
