-- ─── Per-user Tripo3D toggle ────────────────────────────────────────────────
-- When TRUE (default), the worker calls the Tripo3D cloud API for 3D generation.
-- When FALSE, the worker falls back to the locally-hosted Hunyuan3D service.
-- Per-user override of the system-wide TRIPO_ENABLED env flag.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS use_tripo BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN users.use_tripo IS
  'True = use Tripo3D cloud API, False = use local Hunyuan3D (dev/fallback)';
