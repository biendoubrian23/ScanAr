'use client';

import React from 'react';
import { ModelsStoreProvider } from '@/lib/stores/modelsStore';
import { UploadStoreProvider } from '@/lib/stores/uploadStore';
import { FloatingProgressWidget } from '@/components/pipeline/FloatingProgressWidget';

/**
 * Single client-side wrapper that mounts the global stores + the floating
 * progress widget. Mounted once at the dashboard layout level, so all child
 * pages share the same Realtime subscription and the widget persists across
 * route changes.
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModelsStoreProvider>
      <UploadStoreProvider>
        {children}
        <FloatingProgressWidget />
      </UploadStoreProvider>
    </ModelsStoreProvider>
  );
}

export default DashboardProviders;
