"""
End-to-end Tripo3D pipeline test.

Designed to run INSIDE the `worker-ai` container (which has supabase-py + redis
already installed). The image to test is expected at /tmp/test.jpg.

Usage:
    docker cp <some_image>.jpg scanar-worker-ai-1:/tmp/test.jpg
    docker compose exec -T worker-ai python /tmp/test_tripo_e2e.py <user_id> [name]

What it does:
    1. Uploads /tmp/test.jpg to the Supabase 'images' bucket at <user_id>/<uuid>.jpg
    2. Creates a 1-year signed URL (matches the API's behaviour)
    3. Inserts a models_3d row with status='pending'
    4. Pushes the matching ProcessingJob to Redis 'scanar:jobs'
    5. Polls models_3d every 5 seconds until status is completed/failed
    6. Prints the dashboard URL on completion

This mirrors EXACTLY what `POST /api/models` does in the frontend, so the test
exercises the same code path the user will hit in production.
"""

import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone

import redis
from supabase import create_client


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python test_tripo_e2e.py <user_id> [model_name]")
        return 2

    user_id = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else f"TEST Tripo {datetime.now().strftime('%H:%M:%S')}"

    image_path = "/tmp/test.jpg"
    if not os.path.exists(image_path):
        print(f"ERROR: {image_path} not found. Run: docker cp <image> scanar-worker-ai-1:/tmp/test.jpg")
        return 2

    sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    if not sb_url or not sb_key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
        return 2

    sb = create_client(sb_url, sb_key)
    r = redis.from_url(redis_url, decode_responses=True)

    print(f"\n[1/6] Reading {image_path}...")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    print(f"     {len(image_bytes)} bytes loaded")

    print(f"\n[2/6] Uploading to Supabase Storage (bucket=images)...")
    storage_path = f"{user_id}/{uuid.uuid4()}.jpg"
    sb.storage.from_("images").upload(
        path=storage_path,
        file=image_bytes,
        file_options={"content-type": "image/jpeg"},
    )
    print(f"     uploaded → {storage_path}")

    print(f"\n[3/6] Creating signed URL (1 year)...")
    signed = sb.storage.from_("images").create_signed_url(storage_path, 365 * 24 * 60 * 60)
    signed_url = signed["signedURL"] if "signedURL" in signed else signed.get("signedUrl")
    if not signed_url:
        print(f"ERROR: signed URL response missing field: {signed}")
        return 1
    print(f"     OK")

    print(f"\n[4/6] Inserting models_3d row...")
    insert_resp = sb.table("models_3d").insert({
        "user_id": user_id,
        "image_url": signed_url,
        "image_path": storage_path,
        "image_urls": [signed_url],
        "image_paths": [storage_path],
        "name": name,
        "status": "pending",
        "progress": 0,
    }).execute()
    if not insert_resp.data:
        print(f"ERROR: insert returned no data: {insert_resp}")
        return 1
    model_id = insert_resp.data[0]["id"]
    created_at = insert_resp.data[0]["created_at"]
    print(f"     model_id = {model_id}")

    print(f"\n[5/6] Pushing job to Redis 'scanar:jobs'...")
    job = {
        "id":          model_id,
        "model_id":    model_id,
        "user_id":     user_id,
        "image_url":   signed_url,
        "image_path":  storage_path,
        "image_urls":  [signed_url],
        "image_paths": [storage_path],
        "status":      "pending",
        "created_at":  created_at,
    }
    r.rpush("scanar:jobs", json.dumps(job))
    queue_len = r.llen("scanar:jobs")
    print(f"     pushed (queue depth: {queue_len})")

    print(f"\n[6/6] Polling for completion (timeout 6 min)...")
    deadline = time.time() + 360
    last_step = None
    last_progress = -1
    while time.time() < deadline:
        row = sb.table("models_3d").select(
            "status, progress, current_step, error_message, glb_url, real_dimensions_cm"
        ).eq("id", model_id).single().execute()
        d = row.data or {}
        status = d.get("status")
        progress = int(d.get("progress") or 0)
        step = d.get("current_step")

        if step != last_step or progress != last_progress:
            print(f"     [{progress:3d}%] status={status} step={step}")
            last_step = step
            last_progress = progress

        if status == "completed":
            print(f"\n✅ SUCCESS in {int(time.time() - (deadline - 360))}s")
            print(f"   model_id        : {model_id}")
            print(f"   glb_url         : {d.get('glb_url')}")
            real = d.get("real_dimensions_cm")
            if real:
                print(f"   object          : {real.get('object_label')}")
                print(f"   real dimensions : {real.get('width_cm'):.0f} × {real.get('height_cm'):.0f} × {real.get('depth_cm'):.0f} cm")
                print(f"   confidence      : {real.get('confidence'):.0%}")
            print(f"\n   Dashboard       : http://localhost:3050/dashboard/models/{model_id}")
            return 0

        if status == "failed":
            print(f"\n❌ FAILED at step '{step}'")
            print(f"   error: {d.get('error_message')}")
            return 1

        time.sleep(5)

    print(f"\n⏰ TIMEOUT after 6 min — job still {last_step} ({last_progress}%)")
    print(f"   Dashboard: http://localhost:3050/dashboard/models/{model_id}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
