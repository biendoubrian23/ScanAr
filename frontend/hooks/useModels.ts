'use client';

// Re-export of the shared store hook so existing imports keep working.
// All logic lives in `lib/stores/modelsStore.tsx` — single source of truth.
export { useModels } from '@/lib/stores/modelsStore';
