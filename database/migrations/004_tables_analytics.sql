-- ============================================================
-- MIGRATION 004 — analytics (scans AR)
-- ============================================================

CREATE TYPE public.device_type AS ENUM (
  'ios',
  'android',
  'desktop',
  'unknown'
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ar_link_id   UUID NOT NULL REFERENCES public.ar_links(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,

  device_type  public.device_type NOT NULL DEFAULT 'unknown',
  user_agent   TEXT,
  ip_address   INET,
  country      TEXT,
  city         TEXT,

  -- Durée session AR (secondes)
  session_duration INTEGER,

  scanned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incrémente le compteur sur ar_links à chaque scan
CREATE OR REPLACE FUNCTION public.increment_scan_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.ar_links
  SET scan_count = scan_count + 1
  WHERE id = NEW.ar_link_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ar_scan
  AFTER INSERT ON public.analytics
  FOR EACH ROW EXECUTE FUNCTION public.increment_scan_count();

CREATE INDEX idx_analytics_ar_link_id ON public.analytics(ar_link_id);
CREATE INDEX idx_analytics_scanned_at ON public.analytics(scanned_at DESC);
