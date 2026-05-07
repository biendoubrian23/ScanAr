import os
import ssl

import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ── Disable SSL verification (self-signed cert in chain on this network) ──────
ssl._create_default_https_context = ssl._create_unverified_context

# httpx default read timeout is 5s — way too short for storage uploads of a few MB
# (USDZ/GLB) and times out before Supabase finishes processing. Bump to 180s.
_LONG_TIMEOUT = httpx.Timeout(connect=30.0, read=180.0, write=180.0, pool=30.0)

def _should_extend_timeout(existing) -> bool:
    """Replace the timeout with our long one whenever it's None, missing, or
    shorter than 60s (supabase-py / storage3 pass 5–10s by default, way too
    short for multi-MB asset uploads)."""
    if existing is None:
        return True
    if isinstance(existing, (int, float)):
        return existing < 60
    if isinstance(existing, httpx.Timeout):
        # httpx.Timeout's read attribute holds the per-stage read timeout
        return (existing.read or 0) < 60
    return False  # unknown shape — leave caller's value alone

_orig_client_init = httpx.Client.__init__
def _patched_client_init(self, *args, **kwargs):
    kwargs['verify'] = False
    if _should_extend_timeout(kwargs.get('timeout')):
        kwargs['timeout'] = _LONG_TIMEOUT
    _orig_client_init(self, *args, **kwargs)
httpx.Client.__init__ = _patched_client_init

_orig_async_init = httpx.AsyncClient.__init__
def _patched_async_init(self, *args, **kwargs):
    kwargs['verify'] = False
    if _should_extend_timeout(kwargs.get('timeout')):
        kwargs['timeout'] = _LONG_TIMEOUT
    _orig_async_init(self, *args, **kwargs)
httpx.AsyncClient.__init__ = _patched_async_init

# ─────────────────────────────────────────────────────────────────────────────

_client: Client | None = None


def get_admin_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        )
    return _client
