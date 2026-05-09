"""
GPT vision-based real-world size estimation.

Identifies the main object in a photo and estimates its real-world dimensions
in centimetres using:
  - precise object identification (e.g. "office swivel chair", "wine bottle")
  - typical/median sizes from common knowledge for that object category
  - any reference cues visible in the scene (hands, doors, sockets, furniture)
  - perspective and framing analysis

Returns None on failure — the pipeline must remain resilient. When None, the
GLB is uploaded without scaling and the AR viewer falls back to ar-scale=auto.

Cost: ~$0.0005 per call with gpt-4o-mini (vision, low detail).
"""

import asyncio
import base64
import json
from dataclasses import asdict, dataclass
from typing import Optional

from openai import (
    APIConnectionError,
    APIError,
    AsyncOpenAI,
    AuthenticationError,
    RateLimitError,
)

from utils.config import get_config
from utils.logger import logger

MODEL = "gpt-4o-mini"
TIMEOUT_S = 60

PROMPT = (
    "You are a precise dimension estimator for objects in photographs.\n\n"
    "Analyze the image and estimate the REAL-WORLD dimensions in centimetres "
    "of the MAIN object — the prominent, centered, or isolated object that "
    "would be turned into a 3D model.\n\n"
    "Method:\n"
    "1. Identify the object precisely (e.g. 'office swivel chair', 'wine bottle', "
    "'IKEA Klippan 2-seat sofa', 'standard ceramic coffee mug').\n"
    "2. Recall typical/median real-world sizes for that exact object category.\n"
    "3. Use any scale cues visible in the image: hands, doors, electrical sockets, "
    "furniture, people, packaging, fingers, etc.\n"
    "4. Account for camera perspective — close-ups make objects look bigger.\n"
    "5. Return your best estimate in centimetres for width × height × depth as the "
    "object is oriented in the image (width = side-to-side, height = floor-to-top, "
    "depth = front-to-back).\n\n"
    "Reply with ONLY a JSON object — no prose, no markdown — matching this schema:\n"
    "{\n"
    '  "object_label": "<short English label>",\n'
    '  "width_cm":  <number>,\n'
    '  "height_cm": <number>,\n'
    '  "depth_cm":  <number>,\n'
    '  "confidence": <number between 0 and 1>,\n'
    '  "reasoning": "<one short sentence>"\n'
    "}\n\n"
    "Be realistic — prefer typical sizes for the category. Never return zero or negative values."
)


@dataclass
class SizeEstimate:
    object_label: str
    width_cm:  float
    height_cm: float
    depth_cm:  float
    confidence: float
    reasoning: str
    source: str = "estimation"

    def to_dict(self) -> dict:
        return asdict(self)


def _client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, timeout=TIMEOUT_S)


async def _call_vision(api_key: str, image_bytes: bytes, mime: str) -> SizeEstimate:
    client = _client(api_key)
    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": [
                {"type": "text",      "text":      PROMPT},
                {"type": "image_url", "image_url": {"url": data_url, "detail": "low"}},
            ],
        }],
        response_format={"type": "json_object"},
        max_tokens=300,
        temperature=0.1,
    )

    raw = resp.choices[0].message.content or "{}"
    data = json.loads(raw)

    return SizeEstimate(
        object_label=str(data.get("object_label", "object")).strip()[:80] or "object",
        width_cm  = max(0.1, float(data.get("width_cm",  0) or 0)),
        height_cm = max(0.1, float(data.get("height_cm", 0) or 0)),
        depth_cm  = max(0.1, float(data.get("depth_cm",  0) or 0)),
        confidence= max(0.0, min(1.0, float(data.get("confidence", 0.5) or 0.5))),
        reasoning = str(data.get("reasoning", ""))[:280],
    )


async def estimate_real_size(
    image_bytes: bytes,
    mime: str = "image/jpeg",
) -> Optional[SizeEstimate]:
    """Estimate real-world dimensions in cm from a single image. Returns None on failure."""
    cfg = get_config()
    keys = [(label, k) for label, k in (
        ("primary",  cfg.openai_api_key),
        ("fallback", cfg.openai_api_key_fallback),
    ) if k]

    if not keys:
        logger.warning("[size] no OpenAI key — skipping size estimation")
        return None

    last_err: Optional[Exception] = None
    for label, key in keys:
        try:
            logger.info(f"[size] {MODEL} ({label} key, {len(image_bytes)} bytes)")
            est = await _call_vision(key, image_bytes, mime)
            logger.info(
                f"[size] OK ({label}): {est.object_label} → "
                f"{est.width_cm:.0f}×{est.height_cm:.0f}×{est.depth_cm:.0f} cm "
                f"(conf={est.confidence:.2f})"
            )
            return est
        except (AuthenticationError, RateLimitError, APIConnectionError, APIError) as e:
            logger.warning(f"[size] {label} key failed: {type(e).__name__}: {e}")
            last_err = e
        except (json.JSONDecodeError, ValueError, KeyError, TypeError) as e:
            logger.warning(f"[size] {label} key returned invalid JSON: {e}")
            last_err = e
        except Exception as e:
            logger.warning(f"[size] {label} key unexpected: {type(e).__name__}: {e}")
            last_err = e

    logger.error(f"[size] all keys failed ({last_err}); no size estimation")
    return None
