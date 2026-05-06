-- ============================================================
-- MIGRATION 011 — Catalogue events (tracking)
-- ============================================================
-- Lightweight event log for public catalogue pages. Powers the
-- "Catalogues" block of the dashboard analytics page and the
-- per-item view count.
-- Event types:
--   - catalogue_view  : page /c/<slug> rendered for a visitor
--   - item_view       : visitor scrolled an item into viewport (reserved)
--   - item_ar_open    : visitor tapped "Voir en AR" on an item
--   - social_click    : visitor clicked a social link (metadata.key)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.catalogue_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_id  UUID NOT NULL REFERENCES public.catalogues(id) ON DELETE CASCADE,
  item_id       UUID REFERENCES public.catalogue_items(id) ON DELETE CASCADE,

  event_type    TEXT NOT NULL,
  device_type   public.device_type NOT NULL DEFAULT 'unknown',

  user_agent    TEXT,
  ip_address    INET,
  country       TEXT,
  city          TEXT,

  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT catalogue_events_event_type_check
    CHECK (event_type IN ('catalogue_view', 'item_view', 'item_ar_open', 'social_click')),
  CONSTRAINT catalogue_events_metadata_is_object
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT catalogue_events_item_required_for_item_events
    CHECK (
      event_type NOT IN ('item_view', 'item_ar_open') OR item_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_catalogue_events_catalogue_created
  ON public.catalogue_events(catalogue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalogue_events_event_type
  ON public.catalogue_events(event_type);

-- ── Counter trigger ──────────────────────────────────────────
-- Bumps catalogues.view_count for catalogue_view events and
-- catalogue_items.view_count for item_ar_open events.
CREATE OR REPLACE FUNCTION public.bump_catalogue_counters()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_type = 'catalogue_view' THEN
    UPDATE public.catalogues
       SET view_count = view_count + 1
     WHERE id = NEW.catalogue_id;
  ELSIF NEW.event_type = 'item_ar_open' AND NEW.item_id IS NOT NULL THEN
    UPDATE public.catalogue_items
       SET view_count = view_count + 1
     WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_catalogue_event_insert ON public.catalogue_events;
CREATE TRIGGER on_catalogue_event_insert
  AFTER INSERT ON public.catalogue_events
  FOR EACH ROW EXECUTE FUNCTION public.bump_catalogue_counters();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.catalogue_events ENABLE ROW LEVEL SECURITY;

-- Owners can read events for their own catalogues
CREATE POLICY catalogue_events_owner_read ON public.catalogue_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.catalogues c
      WHERE c.id = catalogue_id AND c.user_id = auth.uid()
    )
  );

-- Inserts only happen via the API route using the service role key,
-- so no anon insert policy is needed (service role bypasses RLS).
