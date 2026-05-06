import asyncio
import json
import time
import traceback
from datetime import datetime, timezone

import httpx
import redis
from dotenv import load_dotenv

from core.processor import process_images_to_3d
from core.hunyuan import check_health
from core.image_enhance import verify_openai_keys
from utils.config import get_config
from utils.logger import logger
from utils.supabase_client import get_admin_client

load_dotenv()
config = get_config()


async def update_step(model_id: str, step: str, progress: int, status: str = "started", message: str = None):
    """
    Update the model row with the current pipeline step + append to steps_log.
    Frontend listens via Supabase Realtime and updates the floating widget live.
    """
    supabase = get_admin_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    # Read existing log so we can append (Supabase has no native array_append in update)
    existing = supabase.table("models_3d").select("steps_log").eq("id", model_id).single().execute()
    log = (existing.data or {}).get("steps_log") or []
    entry = {"step": step, "status": status, "at": now_iso}
    if message:
        entry["message"] = message
    log.append(entry)

    update_payload = {
        "current_step": step,
        "progress": progress,
        "status": "processing",
        "steps_log": log,
    }
    supabase.table("models_3d").update(update_payload).eq("id", model_id).execute()


async def update_model_status(model_id: str, status: str, progress: int = None):
    supabase = get_admin_client()
    payload = {"status": status}
    if progress is not None:
        payload["progress"] = progress
    supabase.table("models_3d").update(payload).eq("id", model_id).execute()


async def notify_webhook(payload: dict):
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                config.webhook_url,
                json=payload,
                headers={"X-Webhook-Secret": config.webhook_secret},
            )
            logger.info(f"Webhook response: {resp.status_code}")
        except Exception as e:
            logger.error(f"Webhook notification failed: {e}")


async def wait_for_hunyuan3d():
    logger.info(f"Waiting for Hunyuan3D API at {config.hunyuan3d_api_url}...")
    while True:
        if await check_health():
            logger.info("Hunyuan3D API is ready.")
            return
        await asyncio.sleep(5)


async def process_job(job_data: dict):
    model_id = job_data["id"]
    user_id = job_data["user_id"]

    # Multi-view: prefer the new image_urls array, fall back to legacy single image_url
    image_urls = job_data.get("image_urls")
    if not image_urls:
        legacy = job_data.get("image_url")
        image_urls = [legacy] if legacy else []
    image_paths = job_data.get("image_paths") or [job_data.get("image_path")]

    if not image_urls:
        raise ValueError("Job has no image_urls / image_url")

    logger.info(f"Processing job {model_id} for user {user_id} ({len(image_urls)} image(s))")
    start_time = time.time()

    # Reset steps_log for this run + mark as processing
    supabase = get_admin_client()
    supabase.table("models_3d").update({
        "status": "processing",
        "progress": 5,
        "current_step": "queued",
        "steps_log": [{
            "step": "queued",
            "status": "done",
            "at": datetime.now(timezone.utc).isoformat(),
        }],
        "error_message": None,
    }).eq("id", model_id).execute()

    try:
        async def step_cb(step, progress, status, message):
            await update_step(model_id, step, progress, status, message)

        result = await process_images_to_3d(
            model_id=model_id,
            user_id=user_id,
            image_urls=image_urls,
            image_paths=image_paths,
            step_callback=step_cb,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        await notify_webhook({
            "jobId": model_id,
            "status": "completed",
            "glbUrl": result["glb_url"],
            "glbPath": result["glb_path"],
            "usdzUrl": result.get("usdz_url"),
            "usdzPath": result.get("usdz_path"),
            "processingTimeMs": processing_time_ms,
            "fileSizeBytes": result.get("file_size_bytes"),
            "polygons": result.get("polygons"),
            "materialsCount": result.get("materials_count"),
            "dimensionsMm": result.get("dimensions_mm"),
            "enhancedImageUrls": result.get("enhanced_image_urls"),
            "enhancedImagePaths": result.get("enhanced_image_paths"),
        })

        logger.info(f"Job {model_id} completed in {processing_time_ms}ms")

    except Exception as e:
        logger.error(f"Job {model_id} failed: {e}")
        traceback.print_exc()

        # Capture which step failed
        failed_step = "unknown"
        try:
            existing = supabase.table("models_3d").select("current_step").eq("id", model_id).single().execute()
            failed_step = (existing.data or {}).get("current_step") or "unknown"
        except Exception:
            pass

        await update_step(model_id, failed_step, 0, "failed", str(e)[:500])
        await update_model_status(model_id, "failed", 0)

        await notify_webhook({
            "jobId": model_id,
            "status": "failed",
            "errorMessage": f"[{failed_step}] {e}",
        })


async def worker_loop():
    logger.info("ScanAR Worker-AI starting (Approach B — API client)...")
    logger.info(f"Hunyuan3D API: {config.hunyuan3d_api_url}")
    logger.info(f"Redis: {config.redis_url}")
    logger.info(f"Webhook: {config.webhook_url}")

    if config.hunyuan3d_enabled:
        await wait_for_hunyuan3d()

    if config.openai_enhance_enabled:
        await verify_openai_keys()

    r = redis.from_url(config.redis_url, decode_responses=True)
    logger.info("Listening on 'scanar:jobs'...")

    while True:
        try:
            result = r.blpop("scanar:jobs", timeout=5)

            if result is None:
                continue

            _, raw_job = result
            job_data = json.loads(raw_job)

            await process_job(job_data)

        except redis.ConnectionError:
            logger.warning("Redis connection lost, retrying in 5s...")
            await asyncio.sleep(5)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid job JSON: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            traceback.print_exc()
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(worker_loop())
