-- ============================================================
-- MIGRATION 009 — Catalogues (linktree-style public showcase)
-- ============================================================
-- Each catalogue = one public page (URL: /c/<slug>) bundling
-- multiple existing models_3d into a curated showcase.
-- A user can own several catalogues, each with its own layout
-- (vertical / horizontal), theme, profile header, social links
-- and optional category tabs.
-- ============================================================

-- ── 1. Enums ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.catalogue_layout AS ENUM ('vertical', 'horizontal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.catalogue_theme AS ENUM ('pink', 'beige', 'indigo', 'dark', 'minimal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. catalogues ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalogues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  location    TEXT,
  avatar_url  TEXT,

  layout      public.catalogue_layout NOT NULL DEFAULT 'vertical',
  theme       public.catalogue_theme  NOT NULL DEFAULT 'minimal',

  -- Optional category tabs: [{ id: "starters", label: "Entrées" }, ...]
  -- Empty array = no tabs (single "Tous" view).
  categories  JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Social links: { instagram, website, email, store, whatsapp, tiktok, facebook }
  socials     JSONB NOT NULL DEFAULT '{}'::jsonb,

  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,

  qr_url      TEXT,
  qr_path     TEXT,

  view_count  INTEGER NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT catalogues_categories_is_array CHECK (jsonb_typeof(categories) = 'array'),
  CONSTRAINT catalogues_socials_is_object   CHECK (jsonb_typeof(socials) = 'object')
);

CREATE TRIGGER catalogues_updated_at
  BEFORE UPDATE ON public.catalogues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_catalogues_user_id ON public.catalogues(user_id);
CREATE INDEX idx_catalogues_slug    ON public.catalogues(slug);

-- ── 3. catalogue_items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalogue_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_id  UUID NOT NULL REFERENCES public.catalogues(id) ON DELETE CASCADE,
  model_id      UUID NOT NULL REFERENCES public.models_3d(id)  ON DELETE CASCADE,

  position      INTEGER NOT NULL DEFAULT 0,

  -- Optional overrides (fall back to model name/description if NULL)
  custom_label       TEXT,
  custom_description TEXT,
  price              TEXT,
  badge              TEXT,

  -- Optional category id matching one in catalogues.categories[].id
  category_id   TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A model can appear at most once per catalogue
  UNIQUE (catalogue_id, model_id)
);

CREATE TRIGGER catalogue_items_updated_at
  BEFORE UPDATE ON public.catalogue_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_catalogue_items_catalogue_id ON public.catalogue_items(catalogue_id);
CREATE INDEX idx_catalogue_items_model_id     ON public.catalogue_items(model_id);
CREATE INDEX idx_catalogue_items_position     ON public.catalogue_items(catalogue_id, position);

-- ── 4. Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalogues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalogue_items;

-- ── 5. RLS ─────────────────────────────────────────────────────
ALTER TABLE public.catalogues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_items  ENABLE ROW LEVEL SECURITY;

-- Owner can do anything on their own catalogues
CREATE POLICY catalogues_owner_all ON public.catalogues
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public read of active+public catalogues (used by /c/<slug> via anon role)
CREATE POLICY catalogues_public_read ON public.catalogues
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE AND is_public = TRUE);

-- Owner can do anything on items of their own catalogues
CREATE POLICY catalogue_items_owner_all ON public.catalogue_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.catalogues c
      WHERE c.id = catalogue_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.catalogues c
      WHERE c.id = catalogue_id AND c.user_id = auth.uid()
    )
  );

-- Public read of items belonging to active+public catalogues
CREATE POLICY catalogue_items_public_read ON public.catalogue_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.catalogues c
      WHERE c.id = catalogue_id
        AND c.is_active = TRUE
        AND c.is_public = TRUE
    )
  );
