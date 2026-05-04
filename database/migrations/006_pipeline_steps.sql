-- ============================================================
-- MIGRATION 006 — pipeline step tracking
-- Adds current_step + steps_log to track each phase of 3D generation
-- ============================================================

ALTER TABLE public.models_3d
  ADD COLUMN IF NOT EXISTS current_step TEXT,
  ADD COLUMN IF NOT EXISTS steps_log    JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.models_3d.current_step IS
  'Machine-readable id of the active pipeline step (e.g. uploading, queued, downloading_image, generating_shape, generating_texture, compressing, uploading_assets, done)';

COMMENT ON COLUMN public.models_3d.steps_log IS
  'Append-only log: [{step:"...", status:"started|done|failed", at:"ISO ts", message?:"..."}]';
