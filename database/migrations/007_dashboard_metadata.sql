-- ============================================================
-- MIGRATION 007 — Dashboard metadata (storage quotas + 3D meta + object types)
-- ============================================================

-- ── 1. Object type enum (used by upload selector) ──────────────────────────
DO $$ BEGIN
  CREATE TYPE public.object_type AS ENUM (
    'object',
    'furniture',
    'clothing',
    'vehicle',
    'building',
    'character',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Storage quota on users ─────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 500;

-- Default quotas per plan (idempotent)
UPDATE public.users SET storage_limit_mb = 500    WHERE plan = 'free'       AND storage_limit_mb = 500;
UPDATE public.users SET storage_limit_mb = 5000   WHERE plan = 'pro'        AND storage_limit_mb < 5000;
UPDATE public.users SET storage_limit_mb = 50000  WHERE plan = 'enterprise' AND storage_limit_mb < 50000;

-- Trigger: every new auth user gets the right quota for their plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, plan, storage_limit_mb)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'free',
    500
  );
  RETURN NEW;
END;
$$;

-- ── 3. 3D metadata + classification on models_3d ───────────────────────────
ALTER TABLE public.models_3d
  ADD COLUMN IF NOT EXISTS object_type     public.object_type NOT NULL DEFAULT 'object',
  ADD COLUMN IF NOT EXISTS polygons        INTEGER,
  ADD COLUMN IF NOT EXISTS materials_count INTEGER,
  ADD COLUMN IF NOT EXISTS dimensions_mm   JSONB,        -- { x, y, z } in millimetres
  ADD COLUMN IF NOT EXISTS format          TEXT NOT NULL DEFAULT 'glTF';

COMMENT ON COLUMN public.models_3d.object_type     IS 'Catégorie d''objet sélectionnée à l''upload (default: object)';
COMMENT ON COLUMN public.models_3d.polygons        IS 'Nombre total de triangles dans le GLB final';
COMMENT ON COLUMN public.models_3d.materials_count IS 'Nombre de matériaux distincts dans le GLB';
COMMENT ON COLUMN public.models_3d.dimensions_mm   IS 'Bounding box en millimètres : { x, y, z }';

-- ── 4. View: storage usage per user ────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_storage_usage AS
SELECT
  u.id              AS user_id,
  u.storage_limit_mb,
  COALESCE(
    SUM(m.file_size_bytes)::BIGINT,
    0
  ) AS used_bytes,
  COALESCE(
    ROUND(SUM(m.file_size_bytes)::NUMERIC / 1024 / 1024, 2),
    0
  ) AS used_mb
FROM public.users u
LEFT JOIN public.models_3d m ON m.user_id = u.id
GROUP BY u.id, u.storage_limit_mb;

GRANT SELECT ON public.user_storage_usage TO anon, authenticated, service_role;

-- ── 5. Set Brian's plan to free / 500 MB explicitly ────────────────────────
UPDATE public.users
   SET plan             = 'free',
       storage_limit_mb = 500
 WHERE email = 'brianbiendou@gmail.com';
