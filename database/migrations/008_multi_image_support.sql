-- ============================================================
-- MIGRATION 008 — Multi-image support for models_3d
-- ============================================================
-- Adds JSONB array columns to support 1-4 source images per model
-- (multi-view 3D reconstruction with Hunyuan3D-2mv).
--
-- Backward-compatible: legacy `image_url` / `image_path` are kept and
-- mirror the first element of the new arrays. Existing rows are
-- back-filled by copying their single image into the array.
-- ============================================================

ALTER TABLE public.models_3d
  ADD COLUMN IF NOT EXISTS image_urls  JSONB,
  ADD COLUMN IF NOT EXISTS image_paths JSONB;

-- Back-fill from legacy single-image columns
UPDATE public.models_3d
SET
  image_urls  = COALESCE(image_urls,  jsonb_build_array(image_url)),
  image_paths = COALESCE(image_paths, jsonb_build_array(image_path))
WHERE image_urls IS NULL OR image_paths IS NULL;

-- Constraint: arrays must contain between 1 and 4 elements (when set)
ALTER TABLE public.models_3d
  ADD CONSTRAINT models_3d_image_urls_count
    CHECK (
      image_urls IS NULL
      OR (jsonb_typeof(image_urls) = 'array'
          AND jsonb_array_length(image_urls) BETWEEN 1 AND 4)
    ),
  ADD CONSTRAINT models_3d_image_paths_count
    CHECK (
      image_paths IS NULL
      OR (jsonb_typeof(image_paths) = 'array'
          AND jsonb_array_length(image_paths) BETWEEN 1 AND 4)
    );
