"""
One-shot backfill for the GPT pre-processing of an existing model.

Re-runs the full IA preparation chain (enhance + view completion) and uploads
all resulting images to the `images-enhanced` bucket so the dashboard's
"Améliorée" tab shows everything that was — or would have been — fed to
Hunyuan3D. Skips the (expensive) Hunyuan3D step entirely.

Modes:
  - If the model has NO enhanced URLs at all: run enhance on every original.
  - If it already has enhanced URLs but FEWER than 4 (i.e. missing the
    GPT-generated views): only run view_completion and append the new ones.

Usage (inside the worker-ai container):
    python backfill_enhance.py <model_id>
"""

import asyncio
import os
import sys

import httpx
from dotenv import load_dotenv

from core.image_enhance import enhance_images
from core.view_completion import complete_views
from utils.logger import logger
from utils.supabase_client import get_admin_client

load_dotenv()
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
ENHANCED_BUCKET = "images-enhanced"


async def download(u: str) -> bytes:
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.get(u)
        r.raise_for_status()
        return r.content


def upload(sb, path: str, blob: bytes) -> str:
    sb.storage.from_(ENHANCED_BUCKET).upload(
        path=path,
        file=blob,
        file_options={"content-type": "image/png", "upsert": "true"},
    )
    return f"{SUPABASE_URL}/storage/v1/object/public/{ENHANCED_BUCKET}/{path}"


async def main(model_id: str):
    sb = get_admin_client()
    row = sb.table("models_3d").select(
        "id,user_id,image_urls,image_paths,enhanced_image_urls,enhanced_image_paths"
    ).eq("id", model_id).single().execute().data
    if not row:
        logger.error(f"Model {model_id} not found")
        sys.exit(1)

    user_id = row["user_id"]
    image_urls = row["image_urls"] or []
    if not image_urls:
        logger.error("No image_urls on this model")
        sys.exit(1)

    existing_urls = row.get("enhanced_image_urls") or []
    existing_paths = row.get("enhanced_image_paths") or []

    # ── Phase 1 : enhance every original if not yet done ─────────────────
    enhanced_paths = list(existing_paths)
    enhanced_urls = list(existing_urls)
    enhanced_blobs: list[bytes] = []  # for view_completion, in order

    if len(existing_urls) < len(image_urls):
        logger.info(f"Phase 1: downloading {len(image_urls)} originals...")
        blobs = await asyncio.gather(*(download(u) for u in image_urls))
        logger.info("Running enhancement...")
        results = await enhance_images(blobs)
        enhanced_paths, enhanced_urls = [], []
        for idx, r in enumerate(results):
            if not r.enhanced:
                enhanced_paths.append(None)
                enhanced_urls.append(None)
                enhanced_blobs.append(blobs[idx])
                continue
            path = f"{user_id}/{model_id}/{idx}.png"
            url = upload(sb, path, r.image_bytes)
            enhanced_paths.append(path)
            enhanced_urls.append(url)
            enhanced_blobs.append(r.image_bytes)
            logger.info(f"  uploaded enhanced #{idx} → {path}")
    else:
        logger.info(f"Phase 1 skipped: {len(existing_urls)} enhanced URL(s) already present")
        # Re-download enhanced images to feed view_completion
        for u in existing_urls[:len(image_urls)]:
            if u:
                enhanced_blobs.append(await download(u))

    # ── Phase 2 : view completion (only if < 4 images) ────────────────────
    if len(enhanced_blobs) >= 4:
        logger.info("Phase 2 skipped: already 4 images")
    else:
        logger.info(f"Phase 2: running view_completion on {len(enhanced_blobs)} image(s)...")
        vc = await complete_views(enhanced_blobs)
        n_orig = len(enhanced_blobs)
        for offset, view in enumerate(vc.generated_views):
            idx = n_orig + offset
            if idx >= len(vc.images):
                break
            path = f"{user_id}/{model_id}/gen_{view}.png"
            url = upload(sb, path, vc.images[idx])
            enhanced_paths.append(path)
            enhanced_urls.append(url)
            logger.info(f"  uploaded generated view '{view}' → {path}")

    sb.table("models_3d").update({
        "enhanced_image_urls":  enhanced_urls,
        "enhanced_image_paths": enhanced_paths,
    }).eq("id", model_id).execute()
    logger.info(
        f"Model {model_id} updated → "
        f"{sum(1 for u in enhanced_urls if u)}/{len(enhanced_urls)} enhanced URLs total"
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python backfill_enhance.py <model_id>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
