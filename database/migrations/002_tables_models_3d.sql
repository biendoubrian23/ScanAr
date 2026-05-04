-- ============================================================
-- MIGRATION 002 — models_3d
-- ============================================================

CREATE TYPE public.model_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE IF NOT EXISTS public.models_3d (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Fichier source
  image_url       TEXT NOT NULL,
  image_path      TEXT NOT NULL,           -- chemin Supabase Storage

  -- Résultats IA
  glb_url         TEXT,
  glb_path        TEXT,
  usdz_url        TEXT,
  usdz_path       TEXT,

  -- Métadonnées
  name            TEXT NOT NULL DEFAULT 'Mon modèle 3D',
  description     TEXT,
  status          public.model_status NOT NULL DEFAULT 'pending',
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_message   TEXT,

  -- Stats
  file_size_bytes BIGINT,
  processing_time_ms INTEGER,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER models_3d_updated_at
  BEFORE UPDATE ON public.models_3d
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_models_3d_user_id ON public.models_3d(user_id);
CREATE INDEX idx_models_3d_status  ON public.models_3d(status);
