-- ============================================================
-- MIGRATION 010 — Catalogues v2 (avatar upload + per-item views)
-- ============================================================
-- Adds storage path tracking for uploaded avatars and per-item
-- view counter. Stats configuration & event table will land in
-- a later migration alongside the public stats panel.
-- ============================================================

-- ── Avatar storage path (paired with avatar_url) ──────────────
ALTER TABLE public.catalogues
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- ── Per-item view counter (used by public stats panel) ────────
ALTER TABLE public.catalogue_items
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_catalogue_items_view_count
  ON public.catalogue_items(catalogue_id, view_count DESC);
