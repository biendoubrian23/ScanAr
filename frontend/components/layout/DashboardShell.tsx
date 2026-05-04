import React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardShell({
  children,
  title,
  subtitle,
  action,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Page header */}
        <header
          className={cn(
            'flex items-center justify-between',
            'px-6 pt-6 pb-5 lg:pt-7',
            'border-b border-white/6',
            'bg-dark-950/60 backdrop-blur-md',
            // Offset for mobile hamburger button
            'pl-16 lg:pl-6',
          )}
        >
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-zinc-100 truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-zinc-500 truncate">{subtitle}</p>
            )}
          </div>

          {action && (
            <div className="ml-4 shrink-0">{action}</div>
          )}
        </header>

        {/* Scrollable content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'px-6 py-6',
            'scrollbar-thin',
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
