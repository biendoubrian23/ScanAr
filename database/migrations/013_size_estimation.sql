-- ─── Per-user GPT enhancement toggle ────────────────────────────────────────
-- Lets the user disable the expensive gpt-image-1 + gpt-4o view-completion
-- steps. Size estimation (cheap gpt-4o-mini vision) is NOT toggled — it
-- always runs so AR can display the model at real-world scale.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gpt_enhance_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── Real-world dimensions (cm) for AR fixed-scale display ──────────────────
-- Estimated by GPT vision on the source image. The worker scales the GLB so
-- its bounding box matches these values, allowing <model-viewer ar-scale="fixed">
-- to render the object at its real size (non-zoomable in AR).
ALTER TABLE models_3d
  ADD COLUMN IF NOT EXISTS real_dimensions_cm JSONB;

COMMENT ON COLUMN models_3d.real_dimensions_cm IS
  'GPT-estimated real size: { width_cm, height_cm, depth_cm, confidence, object_label, reasoning, source }';
