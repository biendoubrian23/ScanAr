-- ============================================================
-- MIGRATION 012 — Catalogue stats panel (public, configurable)
-- ============================================================
-- Adds an opt-in "stats panel" rendered on the public catalogue
-- page. Owners pick which blocks to display (summary, top viewed,
-- by price, by category, recent). The panel disappears when
-- stats_visible = FALSE.
-- stats_config schema:
--   { "blocks": [
--       { "type": "summary"                                    },
--       { "type": "top_viewed",  "title": "...", "limit": 5    },
--       { "type": "top_priced",  "sort": "desc", "limit": 5    },
--       { "type": "by_category", "limit": 3                    },
--       { "type": "recent",      "limit": 5                    }
--     ]
--   }
-- ============================================================

ALTER TABLE public.catalogues
  ADD COLUMN IF NOT EXISTS stats_visible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.catalogues
  ADD COLUMN IF NOT EXISTS stats_config  JSONB   NOT NULL DEFAULT '{"blocks":[]}'::jsonb;

-- Shape guard: stats_config must be an object whose `blocks` field is an array.
ALTER TABLE public.catalogues
  DROP CONSTRAINT IF EXISTS catalogues_stats_config_shape;

ALTER TABLE public.catalogues
  ADD CONSTRAINT catalogues_stats_config_shape CHECK (
    jsonb_typeof(stats_config) = 'object'
    AND jsonb_typeof(stats_config -> 'blocks') = 'array'
  );
