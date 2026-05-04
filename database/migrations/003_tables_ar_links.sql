-- ============================================================
-- MIGRATION 003 — ar_links
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ar_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  model_id    UUID NOT NULL REFERENCES public.models_3d(id) ON DELETE CASCADE,

  slug        TEXT UNIQUE NOT NULL,
  title       TEXT,
  description TEXT,

  -- QR code stocké dans Supabase Storage
  qr_url      TEXT,
  qr_path     TEXT,

  -- Contrôle d'accès
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Stats
  scan_count  INTEGER NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ar_links_updated_at
  BEFORE UPDATE ON public.ar_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_ar_links_user_id  ON public.ar_links(user_id);
CREATE INDEX idx_ar_links_model_id ON public.ar_links(model_id);
CREATE INDEX idx_ar_links_slug     ON public.ar_links(slug);
