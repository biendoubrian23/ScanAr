import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    supabase_url: str
    supabase_service_role_key: str
    redis_url: str
    webhook_url: str
    webhook_secret: str
    hunyuan3d_api_url: str
    hunyuan3d_enabled: bool
    openai_api_key: str
    openai_api_key_fallback: str
    openai_enhance_enabled: bool
    tripo_api_key: str
    tripo_enabled: bool


def get_config() -> Config:
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://frontend:3000")

    return Config(
        supabase_url=os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        webhook_url=f"{app_url}/api/webhooks/worker",
        webhook_secret=os.getenv("WEBHOOK_SECRET", "scanar_webhook_secret_dev_2024"),
        hunyuan3d_api_url=os.getenv("HUNYUAN3D_API_URL", "http://hunyuan3d:8080"),
        hunyuan3d_enabled=os.getenv("HUNYUAN3D_ENABLED", "true").lower() == "true",
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_api_key_fallback=os.getenv("OPENAI_API_KEY_FALLBACK", ""),
        openai_enhance_enabled=os.getenv("OPENAI_ENHANCE_ENABLED", "true").lower() == "true",
        tripo_api_key=os.getenv("TRIPO_API_KEY", ""),
        tripo_enabled=os.getenv("TRIPO_ENABLED", "true").lower() == "true",
    )
