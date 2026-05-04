-- ============================================================
-- MIGRATION 005 — Enable Supabase Realtime on key tables
-- ============================================================
-- Required for the useModels hook (live status/progress updates)
-- and ar_links (live scan count updates in the dashboard).

ALTER PUBLICATION supabase_realtime ADD TABLE public.models_3d;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ar_links;
