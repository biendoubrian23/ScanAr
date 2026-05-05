'use client';

import React from 'react';
import { MobileSidebarProvider } from '@/lib/stores/mobileSidebarStore';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-surface">
        <Sidebar />
        {children}
      </div>
    </MobileSidebarProvider>
  );
}
