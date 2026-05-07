"""
Multi-view completion via GPT.

Hunyuan3D-2mv accepts up to 4 views (front, back, left, right) and produces
much better geometry when given several angles. When the user uploads fewer
than 4 photos — or photos that don't cover key faces — we ask GPT to:

  1. Analyse the input images (gpt-4o vision) to detect which canonical
     views are present and describe the object.
  2. Generate the missing views (gpt-image-1 edit) using one input image as
     reference, with a fidelity-first prompt that locks colors/contents.

Hard guarantees:
  - Returns at most 4 images total (Hunyuan3D-2mv limit).
  - Never raises — failure of any sub-step falls back to the originals.
  - First image is always the original front (driver image for Hunyuan).
  - Both API keys (primary/fallback) are tried.
"""

import asyncio
import base64
import io
import json
from dataclasses import dataclass, field
from typing import Optional

from openai import AsyncOpenAI, APIError, APIConnectionError, AuthenticationError, RateLimitError

from utils.config import get_config
from utils.logger import logger

VISION_MODEL    = "gpt-4o"
IMAGE_MODEL     = "gpt-image-1"
SIZE            = "1024x1024"
QUALITY         = "high"   # max detail (low / medium / high)
INPUT_FIDELITY  = "high"   # locks the output to the reference's textures/details
TIMEOUT_S       = 180      # high quality + high fidelity = ~30-60s per image

CANONICAL_VIEWS = ["front", "back", "left", "right"]

ANALYSIS_PROMPT = (
    "You are a 3D-reconstruction expert preparing inputs for the Hunyuan3D-2mv "
    "multi-view diffusion model. It accepts up to 4 canonical views of an object: "
    "front, back, left, right. More angles = much better geometry.\n\n"
    "Analyse the {n} attached image(s) of the SAME object and reply with ONLY a "
    "compact JSON object (no prose, no code fences):\n"
    "{{\n"
    '  "object_description": "<short, precise description: materials, colors, key features, contents>",\n'
    '  "object_type": "<one or two words, e.g. ceramic bowl, wooden chair>",\n'
    '  "views_present": ["front" | "back" | "left" | "right" | "top" | "other", ...],\n'
    '  "views_missing": ["front" | "back" | "left" | "right", ...],\n'
    '  "needs_generation": true|false,\n'
    '  "reasoning": "<one sentence>"\n'
    "}}\n\n"
    "RULES:\n"
    "- views_present is a best-effort label per uploaded image (in order).\n"
    "- views_missing lists ONLY canonical views (front/back/left/right) NOT covered.\n"
    "- needs_generation=true if any canonical view is missing AND we have <4 images.\n"
    "- Be concrete in object_description (e.g. 'black ceramic bowl with quinoa, "
    "  cherry tomatoes, chickpeas, basil, asparagus, butternut squash slices')."
)


def _view_generation_prompt(view: str, description: str) -> str:
    return (
        f"PHOTOREALISTIC PRODUCT PHOTOGRAPHY — render the EXACT SAME physical "
        f"object shown in the reference image, viewed strictly from the "
        f"{view.upper()} side.\n\n"
        f"Object identity: {description}.\n\n"
        f"=== ABSOLUTE FIDELITY REQUIREMENTS ===\n"
        f"1. The output MUST be a photograph — not an illustration, not a "
        f"render, not a painting, not a cartoon, not stylised art.\n"
        f"2. Match the reference image's photographic quality, sharpness, "
        f"micro-details (every grain, fiber, reflection, surface texture).\n"
        f"3. Preserve the EXACT same materials, colors, finish, and surface "
        f"properties visible in the reference.\n"
        f"4. Count every individual item / component visible in the reference. "
        f"The new view must show the SAME exact items in the SAME quantities. "
        f"No invented items, no missing items.\n"
        f"5. Preserve overall proportions, dimensions, and silhouette.\n"
        f"6. Lighting: soft neutral studio light from above-front, identical "
        f"in tone to the reference.\n"
        f"7. Background: pure white (#FFFFFF), with a soft realistic contact "
        f"shadow under the object.\n"
        f"8. Composition: center the object, fill ~70-80% of the frame, "
        f"ample white margin around.\n\n"
        f"=== CAMERA POSITION ===\n"
        f"The {view.upper()} view means the camera is at object height, "
        f"placed directly to the {view} of the object (90° from the reference "
        f"if it was a front view, 180° for back, etc.). Strictly orthographic-"
        f"style: NOT top-down, NOT angled, NOT 3/4 perspective.\n\n"
        f"=== STYLE LOCK ===\n"
        f"Match the reference's photo style precisely. If the reference is a "
        f"high-resolution food photograph with crisp details, the output must "
        f"be the same style — same lens, same depth of field, same color "
        f"grading, same level of detail."
    )


@dataclass
class ViewCompletionResult:
    images: list[bytes]
    analysis: dict = field(default_factory=dict)
    generated_views: list[str] = field(default_factory=list)
    used_fallback: bool = False


def _client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, timeout=TIMEOUT_S)


async def _call_with_keys(coro_fn):
    """Try primary key, then fallback. coro_fn(api_key) -> result. Raises last error."""
    cfg = get_config()
    last_err: Optional[Exception] = None
    for label, key in (("primary", cfg.openai_api_key), ("fallback", cfg.openai_api_key_fallback)):
        if not key:
            continue
        try:
            return await coro_fn(key), (label == "fallback")
        except (AuthenticationError, RateLimitError, APIConnectionError, APIError) as e:
            logger.warning(f"OpenAI {label} key failed: {type(e).__name__}: {e}")
            last_err = e
        except Exception as e:
            logger.warning(f"OpenAI {label} key unexpected error: {type(e).__name__}: {e}")
            last_err = e
    raise last_err if last_err else RuntimeError("No OpenAI keys configured")


async def analyze_views(image_blobs: list[bytes]) -> dict:
    """
    Run gpt-4o vision on the input images. Returns the parsed JSON dict
    (or an empty dict on failure — caller decides what to do).
    """
    if not image_blobs:
        return {}

    content = [{"type": "text", "text": ANALYSIS_PROMPT.format(n=len(image_blobs))}]
    for blob in image_blobs:
        b64 = base64.b64encode(blob).decode("utf-8")
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{b64}"},
        })

    async def _do(key: str):
        client = _client(key)
        resp = await client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": content}],
            response_format={"type": "json_object"},
            max_tokens=400,
        )
        return resp.choices[0].message.content

    try:
        raw, _used_fb = await _call_with_keys(_do)
        analysis = json.loads(raw)
        logger.info(
            f"View analysis: type={analysis.get('object_type')!r}, "
            f"present={analysis.get('views_present')}, "
            f"missing={analysis.get('views_missing')}, "
            f"needs_gen={analysis.get('needs_generation')}"
        )
        return analysis
    except Exception as e:
        logger.warning(f"View analysis failed ({e}); skipping completion")
        return {}


async def generate_view(reference_blob: bytes, view: str, description: str) -> Optional[bytes]:
    """
    Ask gpt-image-1 to render the SAME object from a different canonical view.
    Returns the generated bytes, or None on failure.
    """
    prompt = _view_generation_prompt(view, description)
    buf = io.BytesIO(reference_blob)
    buf.name = "reference.png"

    async def _do(key: str):
        client = _client(key)
        # Reset buffer position in case of retry across keys
        buf.seek(0)
        resp = await client.images.edit(
            model=IMAGE_MODEL,
            image=buf,
            prompt=prompt,
            size=SIZE,
            quality=QUALITY,
            input_fidelity=INPUT_FIDELITY,
            n=1,
        )
        b64 = resp.data[0].b64_json
        if not b64:
            raise RuntimeError("OpenAI returned no image data")
        return base64.b64decode(b64)

    try:
        out, used_fb = await _call_with_keys(_do)
        logger.info(
            f"Generated '{view}' view via {IMAGE_MODEL} "
            f"(quality={QUALITY}, fidelity={INPUT_FIDELITY}, "
            f"{'fallback' if used_fb else 'primary'} key, {len(out)} bytes)"
        )
        return out
    except Exception as e:
        logger.warning(f"View generation failed for '{view}': {e}")
        # Reset buffer for any retry by caller
        buf.seek(0)
        return None


async def complete_views(image_blobs: list[bytes]) -> ViewCompletionResult:
    """
    Orchestrator. Analyses inputs, generates missing canonical views (up to a
    total of 4 images), returns the (possibly augmented) list of image bytes.
    """
    cfg = get_config()
    if not cfg.openai_enhance_enabled:
        return ViewCompletionResult(images=image_blobs)

    n = len(image_blobs)
    if n == 0:
        return ViewCompletionResult(images=[])

    if n >= 4:
        # Already at Hunyuan3D-2mv's max; no analysis needed
        logger.info("View completion: 4 images already provided — skipping analysis")
        return ViewCompletionResult(images=image_blobs)

    analysis = await analyze_views(image_blobs)
    if not analysis or not analysis.get("needs_generation"):
        return ViewCompletionResult(images=image_blobs, analysis=analysis)

    description = analysis.get("object_description", "the object shown in the reference image")
    missing = [v for v in (analysis.get("views_missing") or []) if v in CANONICAL_VIEWS]
    slots_left = 4 - n
    targets = missing[:slots_left]
    if not targets:
        return ViewCompletionResult(images=image_blobs, analysis=analysis)

    logger.info(f"Generating {len(targets)} missing view(s): {targets}")
    generated = await asyncio.gather(*(
        generate_view(image_blobs[0], v, description) for v in targets
    ))

    out_images = list(image_blobs)
    out_views: list[str] = []
    for view, blob in zip(targets, generated):
        if blob is not None:
            out_images.append(blob)
            out_views.append(view)

    logger.info(
        f"View completion: {len(image_blobs)} input → {len(out_images)} total "
        f"({len(out_views)} generated: {out_views})"
    )
    return ViewCompletionResult(
        images=out_images,
        analysis=analysis,
        generated_views=out_views,
    )
