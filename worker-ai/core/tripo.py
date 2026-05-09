"""
Tripo3D API client — image-to-3D and multiview-to-3D.

Async, contract-compatible with `core.hunyuan.generate_3d_with_usdz`:
    result = await tripo.generate_3d_with_usdz(image_blobs)
    # result = {"glb_bytes": <bytes>, "usdz_bytes": None}

Workflow:
  1. Upload each image  →  POST /upload/sts            →  image_token
  2. Create a task      →  POST /task                  →  task_id
                            type=image_to_model        (1 image)
                            type=multiview_to_model    (2-4 images)
  3. Poll the task      →  GET  /task/{task_id}        until status=success
  4. Download the GLB   →  output.pbr_model URL  (TTL 5 min — fetch immediately)

Concurrency limits enforced by Tripo (per account, per model_version group):
  - P1 Generation:        5 concurrent
  - Standard Generation:  10 concurrent (Turbo, V3.x, V2.x, V1.4)

The worker queue (Redis) absorbs back-pressure beyond these limits — Tripo
returns 429 with a `Retry-After` header which we honour.

Pricing (P1 with default config used here):
  image_to_model + texture_quality=detailed = 60 credits = $0.60 per model
"""

import asyncio
import io
import time
from dataclasses import dataclass
from typing import Optional, Union

import httpx

from utils.config import get_config
from utils.logger import logger

# ── Configuration ──────────────────────────────────────────────────────────
BASE_URL = "https://api.tripo3d.ai/v2/openapi"
MODEL_VERSION = "P1-20260311"     # Latest, optimised for AR/mobile (low-poly clean topology)
TEXTURE_QUALITY = "detailed"      # +10 credits — HD textures, critical for food realism
FACE_LIMIT = 8000                 # Sweet spot for mobile AR (1-2 MB GLB, 50-60 fps)
ORIENTATION = "align_image"       # Auto-rotate to match input image
PBR = True                        # PBR materials → realistic AR lighting

# Polling
POLL_INTERVAL_SECONDS = 4         # Check task status every 4s
POLL_TIMEOUT_SECONDS = 300        # Hard cap 5 min (most jobs finish in 30-90s)

# Network
UPLOAD_TIMEOUT = 60               # multipart upload timeout
TASK_TIMEOUT = 30                 # POST /task timeout
DOWNLOAD_TIMEOUT = 120            # GLB download timeout (URL TTL = 5 min)


@dataclass
class TripoResult:
    glb_bytes: bytes
    consumed_credits: int
    task_id: str
    real_dimensions_m: Optional[dict]  # {"x": float, "y": float, "z": float} from auto_size


class TripoError(Exception):
    """Base exception for any Tripo failure (auth, rate-limit, server, content-policy)."""

    def __init__(self, code: int, message: str, suggestion: str = "", trace_id: str = ""):
        self.code = code
        self.message = message
        self.suggestion = suggestion
        self.trace_id = trace_id
        super().__init__(f"[tripo:{code}] {message}" + (f" — trace={trace_id}" if trace_id else ""))


def _headers(api_key: str, include_content_type: bool = True) -> dict:
    h = {"Authorization": f"Bearer {api_key}"}
    if include_content_type:
        h["Content-Type"] = "application/json"
    return h


def _extract_error(resp: httpx.Response) -> TripoError:
    """Parse the standard Tripo error envelope."""
    trace = resp.headers.get("X-Tripo-Trace-ID", "")
    try:
        body = resp.json()
    except Exception:
        return TripoError(resp.status_code, resp.text[:300], "", trace)
    return TripoError(
        code=int(body.get("code", resp.status_code)),
        message=str(body.get("message", "")),
        suggestion=str(body.get("suggestion", "")),
        trace_id=trace,
    )


# ── Step 1: Upload image ───────────────────────────────────────────────────
async def upload_image(api_key: str, image_bytes: bytes, mime: str = "image/jpeg") -> str:
    """Upload one image, return its image_token. Caller passes JPEG bytes."""
    ext = "png" if "png" in mime else ("webp" if "webp" in mime else "jpg")
    files = {"file": (f"image.{ext}", io.BytesIO(image_bytes), mime)}

    async with httpx.AsyncClient(timeout=UPLOAD_TIMEOUT) as client:
        resp = await client.post(
            f"{BASE_URL}/upload/sts",
            headers=_headers(api_key, include_content_type=False),
            files=files,
        )
    if resp.status_code != 200:
        raise _extract_error(resp)

    data = resp.json()
    if data.get("code") != 0:
        raise TripoError(
            data.get("code", -1),
            data.get("message", ""),
            data.get("suggestion", ""),
            resp.headers.get("X-Tripo-Trace-ID", ""),
        )
    return data["data"]["image_token"]


# ── Step 2: Create task ────────────────────────────────────────────────────
def _build_image_to_model_payload(image_token: str) -> dict:
    return {
        "type": "image_to_model",
        "model_version": MODEL_VERSION,
        "file": {"type": "jpg", "file_token": image_token},
        "texture": True,
        "pbr": PBR,
        "texture_quality": TEXTURE_QUALITY,
        "auto_size": True,
        "orientation": ORIENTATION,
        "face_limit": FACE_LIMIT,
    }


def _build_multiview_to_model_payload(image_tokens: list[str]) -> dict:
    """
    Tripo expects EXACTLY 4 slots in order [front, left, back, right].
    Slots beyond what we have are filled with `{}` (empty objects).
    Front view (index 0) is mandatory and cannot be empty.
    """
    files: list[dict] = []
    for i in range(4):
        if i < len(image_tokens):
            files.append({"type": "jpg", "file_token": image_tokens[i]})
        else:
            files.append({})

    return {
        "type": "multiview_to_model",
        "model_version": MODEL_VERSION,
        "files": files,
        "texture": True,
        "pbr": PBR,
        "texture_quality": TEXTURE_QUALITY,
        "auto_size": True,
        "face_limit": FACE_LIMIT,
    }


async def create_task(api_key: str, image_tokens: list[str]) -> str:
    """Create a generation task, return its task_id.

    1 image  → image_to_model
    2-4 imgs → multiview_to_model
    """
    if not image_tokens:
        raise ValueError("create_task: no image tokens")
    if len(image_tokens) > 4:
        image_tokens = image_tokens[:4]
        logger.warning(f"[tripo] truncating to 4 images (was {len(image_tokens)})")

    if len(image_tokens) == 1:
        payload = _build_image_to_model_payload(image_tokens[0])
    else:
        payload = _build_multiview_to_model_payload(image_tokens)

    async with httpx.AsyncClient(timeout=TASK_TIMEOUT) as client:
        resp = await client.post(
            f"{BASE_URL}/task",
            headers=_headers(api_key),
            json=payload,
        )
    if resp.status_code != 200:
        raise _extract_error(resp)

    data = resp.json()
    if data.get("code") != 0:
        raise TripoError(
            data.get("code", -1),
            data.get("message", ""),
            data.get("suggestion", ""),
            resp.headers.get("X-Tripo-Trace-ID", ""),
        )

    task_id = data["data"]["task_id"]
    logger.info(
        f"[tripo] task created: {task_id} "
        f"(type={payload['type']}, version={MODEL_VERSION}, "
        f"texture_quality={TEXTURE_QUALITY}, face_limit={FACE_LIMIT})"
    )
    return task_id


# ── Step 3: Poll task ──────────────────────────────────────────────────────
async def get_task(api_key: str, task_id: str) -> dict:
    async with httpx.AsyncClient(timeout=TASK_TIMEOUT) as client:
        resp = await client.get(
            f"{BASE_URL}/task/{task_id}",
            headers=_headers(api_key, include_content_type=False),
        )
    if resp.status_code != 200:
        raise _extract_error(resp)

    body = resp.json()
    if body.get("code") != 0:
        raise TripoError(
            body.get("code", -1),
            body.get("message", ""),
            body.get("suggestion", ""),
            resp.headers.get("X-Tripo-Trace-ID", ""),
        )
    return body["data"]


async def wait_for_task(
    api_key: str,
    task_id: str,
    progress_cb=None,
    timeout: int = POLL_TIMEOUT_SECONDS,
    interval: float = POLL_INTERVAL_SECONDS,
) -> dict:
    """Poll until status is finalized. Returns the final task object on success."""
    deadline = time.time() + timeout
    last_progress = -1

    while time.time() < deadline:
        task = await get_task(api_key, task_id)
        status = task.get("status", "unknown")
        progress = int(task.get("progress", 0) or 0)

        if progress != last_progress:
            logger.info(f"[tripo] {task_id}: status={status} progress={progress}%")
            last_progress = progress
            if progress_cb:
                try:
                    await progress_cb(progress)
                except Exception as e:
                    logger.warning(f"[tripo] progress_cb failed: {e}")

        if status == "success":
            return task

        if status in ("failed", "banned", "expired", "cancelled", "unknown"):
            raise TripoError(
                code=2099,
                message=f"Tripo task ended in status '{status}'",
                suggestion="Retry with a different image or contact support",
                trace_id=task_id,
            )

        await asyncio.sleep(interval)

    raise TripoError(
        code=2098,
        message=f"Tripo task {task_id} timed out after {timeout}s",
        suggestion="Check Tripo dashboard for the task status",
        trace_id=task_id,
    )


# ── Step 4: Download GLB ───────────────────────────────────────────────────
async def download_glb(url: str) -> bytes:
    """Download the GLB from the signed URL (TTL 5 min from completion)."""
    async with httpx.AsyncClient(timeout=DOWNLOAD_TIMEOUT) as client:
        resp = await client.get(url)
    if resp.status_code != 200:
        raise TripoError(
            code=2097,
            message=f"GLB download failed (HTTP {resp.status_code})",
            suggestion="The signed URL likely expired (5 min TTL). Restart the task.",
        )
    if len(resp.content) < 100:
        raise TripoError(
            code=2096,
            message=f"GLB too small ({len(resp.content)} bytes)",
            suggestion="Likely a corrupted output — retry the task.",
        )
    return resp.content


# ── End-to-end orchestration ───────────────────────────────────────────────
async def generate_3d_with_usdz(
    image_blobs: Union[bytes, list[bytes]],
    progress_cb=None,
) -> dict:
    """Drop-in replacement for `core.hunyuan.generate_3d_with_usdz`.

    USDZ is NOT generated here — Tripo can do it via post-process (5 credits)
    but our existing Blender pipeline in core.hunyuan does it for free post-hoc.
    Returns usdz_bytes=None and lets the caller convert if it wants to.
    """
    cfg = get_config()
    if not cfg.tripo_api_key:
        raise TripoError(
            code=2095,
            message="TRIPO_API_KEY is empty",
            suggestion="Set TRIPO_API_KEY in worker-ai env",
        )

    # Normalise input
    if isinstance(image_blobs, (bytes, bytearray)):
        blobs = [bytes(image_blobs)]
    else:
        blobs = list(image_blobs)
    if not blobs:
        raise ValueError("No image data provided")
    if len(blobs) > 4:
        logger.warning(f"[tripo] truncating to 4 images (was {len(blobs)})")
        blobs = blobs[:4]

    # 1. Upload all images (parallel)
    logger.info(f"[tripo] uploading {len(blobs)} image(s)...")
    upload_tasks = [upload_image(cfg.tripo_api_key, b) for b in blobs]
    image_tokens = await asyncio.gather(*upload_tasks)
    logger.info(f"[tripo] uploaded: {len(image_tokens)} token(s)")

    # 2. Create task
    task_id = await create_task(cfg.tripo_api_key, image_tokens)

    # 3. Poll
    task = await wait_for_task(cfg.tripo_api_key, task_id, progress_cb=progress_cb)

    output = task.get("output", {})
    glb_url = output.get("pbr_model") or output.get("model")
    if not glb_url:
        raise TripoError(
            code=2094,
            message="Tripo task succeeded but returned no model URL",
            suggestion="Check the Tripo dashboard for the task output",
            trace_id=task_id,
        )

    # 4. Download GLB
    glb_bytes = await download_glb(glb_url)
    consumed = int(task.get("consumed_credit", 0) or 0)

    logger.info(
        f"[tripo] DONE task={task_id} credits={consumed} glb={len(glb_bytes)} bytes"
    )

    return {
        "glb_bytes": glb_bytes,
        "usdz_bytes": None,
        "consumed_credits": consumed,
        "task_id": task_id,
    }


# ── Health/wallet helpers ──────────────────────────────────────────────────
async def get_balance(api_key: str = None) -> Optional[dict]:
    """GET /user/balance — returns {balance, frozen} in credits, or None on failure."""
    cfg = get_config()
    key = api_key or cfg.tripo_api_key
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE_URL}/user/balance",
                headers=_headers(key, include_content_type=False),
            )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == 0:
                return data["data"]
        logger.warning(f"[tripo] balance check failed: HTTP {resp.status_code}")
    except Exception as e:
        logger.warning(f"[tripo] balance check error: {e}")
    return None


async def verify_api_key() -> bool:
    """Lightweight startup probe — logs balance, returns True if key works."""
    cfg = get_config()
    if not cfg.tripo_api_key:
        logger.warning("[tripo] no TRIPO_API_KEY set — Tripo will be unavailable")
        return False
    bal = await get_balance(cfg.tripo_api_key)
    if bal is None:
        logger.error("[tripo] API key verification FAILED")
        return False
    logger.info(f"[tripo] API key OK — balance: {bal.get('balance', 0)} credits "
                f"(frozen: {bal.get('frozen', 0)})")
    return True
