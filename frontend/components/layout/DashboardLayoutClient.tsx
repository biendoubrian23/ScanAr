'use client';

import React from 'react';
import { MobileSidebarProvider } from '@/lib/stores/mobileSidebarStore';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-brand-50/30 via-slate-50 to-purple-50/20">
        <Sidebar />
        {children}
      </div>
    </MobileSidebarProvider>
  );
}
