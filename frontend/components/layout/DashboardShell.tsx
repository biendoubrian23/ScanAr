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
      {/* Page header */}
      <header
        className={cn(
          'flex items-center justify-between',
          'px-6 py-4 border-b border-gray-200 bg-white',
          'pl-14 lg:pl-6',
        )}
      >
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </header>

      {/* Content */}
      <main
        className={cn(
          'flex-1 overflow-y-auto px-6 py-6 scrollbar-thin',
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}

export default DashboardShell;
