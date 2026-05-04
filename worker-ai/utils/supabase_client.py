import os
import ssl

import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ── Disable SSL verification (self-signed cert in chain on this network) ──────
ssl._create_default_https_context = ssl._create_unverified_context

_orig_client_init = httpx.Client.__init__
def _patched_client_init(self, *args, **kwargs):
    kwargs['verify'] = False
    _orig_client_init(self, *args, **kwargs)
httpx.Client.__init__ = _patched_client_init

_orig_async_init = httpx.AsyncClient.__init__
def _patched_async_init(self, *args, **kwargs):
    kwargs['verify'] = False
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
