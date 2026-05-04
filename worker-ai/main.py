import asyncio
import json
import os
import time
import traceback

import httpx
import redis
from dotenv import load_dotenv

from core.processor import process_image_to_3d
from core.hunyuan import check_health
from utils.config import get_config
from utils.logger import logger
from utils.supabase_client import get_admin_client

load_dotenv()
config = get_config()


async def update_model_progress(model_id: str, progress: int, status: str = "processing"):
    supabase = get_admin_client()
    supabase.table("models_3d").update({
        "progress": progress,
        "status": status,
    }).eq("id", model_id).execute()


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
    image_url = job_data["image_url"]
    image_path = job_data["image_path"]

    logger.info(f"Processing job {model_id} for user {user_id}")
    start_time = time.time()

    try:
        await update_model_progress(model_id, 10, "processing")

        result = await process_image_to_3d(
            model_id=model_id,
            user_id=user_id,
            image_url=image_url,
            image_path=image_path,
            progress_callback=lambda p: asyncio.ensure_future(
                update_model_progress(model_id, p)
            ),
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
        })

        logger.info(f"Job {model_id} completed in {processing_time_ms}ms")

    except Exception as e:
        logger.error(f"Job {model_id} failed: {e}")
        traceback.print_exc()

        await update_model_progress(model_id, 0, "failed")

        await notify_webhook({
            "jobId": model_id,
            "status": "failed",
            "errorMessage": str(e),
        })


async def worker_loop():
    logger.info("ScanAR Worker-AI starting (Approach B — API client)...")
    logger.info(f"Hunyuan3D API: {config.hunyuan3d_api_url}")
    logger.info(f"Redis: {config.redis_url}")
    logger.info(f"Webhook: {config.webhook_url}")

    if config.hunyuan3d_enabled:
        await wait_for_hunyuan3d()

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
