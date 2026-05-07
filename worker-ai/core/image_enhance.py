"""
GPT Image (gpt-image-1) preprocessing step.

Cleans the user-uploaded image (background removal, lighting, soft shadow,
white background) WITHOUT altering the object's geometry, proportions or
texture, so the downstream Hunyuan3D reconstruction stays faithful.

Two API keys are supported: a primary and a fallback. If the primary key
fails (auth, rate limit, network), the same call is retried with the
fallback key. If both fail, the original image bytes are returned so the
3D pipeline never aborts.
"""

import asyncio
import base64
import io
from dataclasses import dataclass
from typing import Optional

from openai import AsyncOpenAI, APIError, APIConnectionError, AuthenticationError, RateLimitError

from utils.config import get_config
from utils.logger import logger

# Strict prompt — improves quality only, never modifies the object.
ENHANCE_PROMPT = (
    "Clean the image. Isolate the main object. Remove the background. "
    "Place the object on a neutral white background with soft realistic shadow. "
    "Improve lighting and clarity.\n\n"
    "CRITICAL:\n"
    "Do NOT alter the object shape, geometry, proportions, or texture.\n"
    "Do NOT redesign or stylize the object.\n"
    "Keep it exactly identical to the original, only improve image quality."
)

MODEL = "gpt-image-1"
SIZE = "1024x1024"
QUALITY = "high"          # low / medium / high — high = max detail, costlier
INPUT_FIDELITY = "high"   # forces gpt-image-1 to preserve reference details
TIMEOUT_S = 120


@dataclass
class EnhanceResult:
    image_bytes: bytes
    used_fallback: bool
    enhanced: bool  # False when both keys failed and we returned the original


def _client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, timeout=TIMEOUT_S)


async def _call_edit(api_key: str, image_bytes: bytes, mime: str) -> bytes:
    """Single attempt against the OpenAI Image Edit endpoint."""
    client = _client(api_key)
    # The SDK accepts a file-like with a name attribute (used to infer MIME).
    buf = io.BytesIO(image_bytes)
    ext = "png" if "png" in mime else "jpg"
    buf.name = f"input.{ext}"

    resp = await client.images.edit(
        model=MODEL,
        image=buf,
        prompt=ENHANCE_PROMPT,
        size=SIZE,
        quality=QUALITY,
        input_fidelity=INPUT_FIDELITY,
        n=1,
    )
    b64 = resp.data[0].b64_json
    if not b64:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(b64)


async def enhance_image(
    image_bytes: bytes,
    mime: str = "image/jpeg",
    index: int = 0,
) -> EnhanceResult:
    """
    Enhance a single image. Tries the primary key, then the fallback key.
    Falls back to the original bytes if both keys fail (logged, not raised).
    """
    cfg = get_config()

    if not cfg.openai_enhance_enabled:
        logger.info(f"[enhance#{index}] disabled by config — using original")
        return EnhanceResult(image_bytes=image_bytes, used_fallback=False, enhanced=False)

    keys = [
        ("primary",  cfg.openai_api_key),
        ("fallback", cfg.openai_api_key_fallback),
    ]
    keys = [(label, k) for label, k in keys if k]

    if not keys:
        logger.warning(f"[enhance#{index}] no OpenAI key configured — using original")
        return EnhanceResult(image_bytes=image_bytes, used_fallback=False, enhanced=False)

    last_err: Optional[Exception] = None
    for label, key in keys:
        try:
            logger.info(
                f"[enhance#{index}] {MODEL} ({label} key, "
                f"quality={QUALITY}, fidelity={INPUT_FIDELITY}, {len(image_bytes)} bytes)"
            )
            out = await _call_edit(key, image_bytes, mime)
            logger.info(f"[enhance#{index}] OK ({label} key) → {len(out)} bytes")
            return EnhanceResult(
                image_bytes=out,
                used_fallback=(label == "fallback"),
                enhanced=True,
            )
        except (AuthenticationError, RateLimitError, APIConnectionError, APIError) as e:
            logger.warning(f"[enhance#{index}] {label} key failed: {type(e).__name__}: {e}")
            last_err = e
        except Exception as e:
            logger.warning(f"[enhance#{index}] {label} key unexpected error: {type(e).__name__}: {e}")
            last_err = e

    logger.error(f"[enhance#{index}] all keys failed ({last_err}); using original image")
    return EnhanceResult(image_bytes=image_bytes, used_fallback=False, enhanced=False)


async def enhance_images(image_blobs: list[bytes]) -> list[EnhanceResult]:
    """Enhance 1..4 images in parallel. Order is preserved."""
    tasks = [enhance_image(b, index=i) for i, b in enumerate(image_blobs)]
    return await asyncio.gather(*tasks)


async def verify_openai_keys() -> dict:
    """
    Lightweight startup check: list models with each key. Logs status and
    returns a dict so the worker can decide what to log/announce.
    """
    cfg = get_config()
    status = {"primary_ok": False, "fallback_ok": False}

    async def _probe(label: str, key: str) -> bool:
        if not key:
            logger.warning(f"OpenAI {label} key: not configured")
            return False
        try:
            client = _client(key)
            await client.models.list()
            logger.info(f"OpenAI {label} key: OK")
            return True
        except Exception as e:
            logger.warning(f"OpenAI {label} key: FAILED ({type(e).__name__}: {e})")
            return False

    status["primary_ok"]  = await _probe("primary",  cfg.openai_api_key)
    status["fallback_ok"] = await _probe("fallback", cfg.openai_api_key_fallback)

    if not (status["primary_ok"] or status["fallback_ok"]):
        logger.error("No working OpenAI key — image enhancement will be skipped (originals used)")
    return status
