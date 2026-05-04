import React from 'react';
import { cn } from '@/lib/utils';

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
  return (
    <>
      {/* Page header — fixed h-[81px] so the bottom border lines up exactly
          with the sidebar logo divider (same fixed height there). */}
      <header
        className={cn(
          'flex items-center justify-between gap-4 shrink-0',
          'px-6 lg:px-8 h-[81px] border-b border-gray-200 bg-white',
          'pl-14 lg:pl-8',
        )}
      >
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </header>

      {/* Content — full width, no max constraint so the layout breathes on
          large screens. Pages can still wrap individual sections if needed. */}
      <main
        className={cn(
          'flex-1 overflow-y-auto px-6 lg:px-8 py-6 scrollbar-thin',
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}

export default DashboardShell;
