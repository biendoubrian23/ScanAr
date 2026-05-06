'use client';

import React from 'react';
import { ModelsStoreProvider } from '@/lib/stores/modelsStore';
import { ArLinksStoreProvider } from '@/lib/stores/arLinksStore';
import { CataloguesStoreProvider } from '@/lib/stores/cataloguesStore';
import { UploadStoreProvider } from '@/lib/stores/uploadStore';
import { FloatingProgressWidget } from '@/components/pipeline/FloatingProgressWidget';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModelsStoreProvider>
      <ArLinksStoreProvider>
        <CataloguesStoreProvider>
          <UploadStoreProvider>
            {children}
            <FloatingProgressWidget />
            <MobileBottomNav />
          </UploadStoreProvider>
        </CataloguesStoreProvider>
      </ArLinksStoreProvider>
    </ModelsStoreProvider>
  );
}

export default DashboardProviders;
