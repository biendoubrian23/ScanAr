"""
One-shot backfill: re-runs the GPT enhancement step on a model that was created
BEFORE enhanced-image storage existed, then uploads the results and updates the
DB row. Skips the (expensive) Hunyuan3D step entirely.

Usage (inside the worker-ai container):
    python backfill_enhance.py <model_id>
"""

import asyncio
import os
import sys

import httpx
from dotenv import load_dotenv

from core.image_enhance import enhance_images
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


async def main(model_id: str):
    sb = get_admin_client()
    row = sb.table("models_3d").select("id,user_id,image_urls,image_paths,enhanced_image_urls").eq("id", model_id).single().execute().data
    if not row:
        logger.error(f"Model {model_id} not found")
        sys.exit(1)
    if row.get("enhanced_image_urls"):
        logger.info(f"Model {model_id} already has enhanced URLs — skipping")
        return

    user_id = row["user_id"]
    image_urls = row["image_urls"] or []
    if not image_urls:
        logger.error("No image_urls on this model")
        sys.exit(1)

    logger.info(f"Downloading {len(image_urls)} originals...")
    blobs = await asyncio.gather(*(download(u) for u in image_urls))

    logger.info("Running enhancement...")
    results = await enhance_images(blobs)

    enhanced_paths, enhanced_urls = [], []
    for idx, r in enumerate(results):
        if not r.enhanced:
            enhanced_paths.append(None)
            enhanced_urls.append(None)
            continue
        path = f"{user_id}/{model_id}/{idx}.png"
        sb.storage.from_(ENHANCED_BUCKET).upload(
            path=path,
            file=r.image_bytes,
            file_options={"content-type": "image/png", "upsert": "true"},
        )
        enhanced_paths.append(path)
        enhanced_urls.append(f"{SUPABASE_URL}/storage/v1/object/public/{ENHANCED_BUCKET}/{path}")
        logger.info(f"  uploaded enhanced #{idx} → {path}")

    sb.table("models_3d").update({
        "enhanced_image_urls":  enhanced_urls,
        "enhanced_image_paths": enhanced_paths,
    }).eq("id", model_id).execute()
    logger.info(f"Model {model_id} updated with {sum(1 for u in enhanced_urls if u)}/{len(results)} enhanced URLs")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python backfill_enhance.py <model_id>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
