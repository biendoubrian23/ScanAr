'use client';

import React from 'react';
import { ModelsStoreProvider } from '@/lib/stores/modelsStore';
import { ArLinksStoreProvider } from '@/lib/stores/arLinksStore';
import { UploadStoreProvider } from '@/lib/stores/uploadStore';
import { FloatingProgressWidget } from '@/components/pipeline/FloatingProgressWidget';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModelsStoreProvider>
      <ArLinksStoreProvider>
        <UploadStoreProvider>
          {children}
          <FloatingProgressWidget />
          <MobileBottomNav />
        </UploadStoreProvider>
      </ArLinksStoreProvider>
    </ModelsStoreProvider>
  );
}

export default DashboardProviders;
