import os

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def get_admin_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        )
    return _client
