import asyncio
import os
import subprocess
import tempfile
from typing import Callable, Optional

import httpx

from utils.logger import logger
from utils.supabase_client import get_admin_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
GLB_BUCKET = "models-glb"
USDZ_BUCKET = "models-usdz"
ENABLE_DRACO = os.getenv("ENABLE_DRACO", "true").lower() == "true"


async def download_image(image_url: str) -> bytes:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
        return resp.content


async def process_image_to_3d(
    model_id: str,
    user_id: str,
    image_url: str,
    image_path: str,
    progress_callback: Optional[Callable] = None,
) -> dict:
    supabase = get_admin_client()

    if progress_callback:
        await progress_callback(5)

    logger.info(f"Downloading source image: {image_url}")
    image_data = await download_image(image_url)
    logger.info(f"Image downloaded: {len(image_data)} bytes")

    if progress_callback:
        await progress_callback(10)

    from core.hunyuan import generate_3d_with_usdz

    if progress_callback:
        await progress_callback(15)

    result = await generate_3d_with_usdz(image_data)
    glb_bytes = result["glb_bytes"]
    usdz_bytes = result.get("usdz_bytes")

    if progress_callback:
        await progress_callback(75)

    if ENABLE_DRACO:
        glb_bytes = _compress_draco(glb_bytes)

    if progress_callback:
        await progress_callback(80)

    glb_path = f"{user_id}/{model_id}.glb"
    supabase.storage.from_(GLB_BUCKET).upload(
        path=glb_path,
        file=glb_bytes,
        file_options={"content-type": "model/gltf-binary"},
    )
    glb_url = f"{SUPABASE_URL}/storage/v1/object/public/{GLB_BUCKET}/{glb_path}"
    logger.info(f"GLB uploaded: {glb_path} ({len(glb_bytes)} bytes)")

    if progress_callback:
        await progress_callback(90)

    usdz_url = None
    usdz_path = None
    if usdz_bytes:
        usdz_path = f"{user_id}/{model_id}.usdz"
        supabase.storage.from_(USDZ_BUCKET).upload(
            path=usdz_path,
            file=usdz_bytes,
            file_options={"content-type": "model/vnd.usdz+zip"},
        )
        usdz_url = f"{SUPABASE_URL}/storage/v1/object/public/{USDZ_BUCKET}/{usdz_path}"
        logger.info(f"USDZ uploaded: {usdz_path} ({len(usdz_bytes)} bytes)")

    if progress_callback:
        await progress_callback(100)

    return {
        "glb_url": glb_url,
        "glb_path": glb_path,
        "usdz_url": usdz_url,
        "usdz_path": usdz_path,
    }


def _compress_draco(glb_bytes: bytes) -> bytes:
    gltfpack = _find_gltfpack()
    if gltfpack is None:
        return glb_bytes

    try:
        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as f_in:
            f_in.write(glb_bytes)
            input_path = f_in.name

        output_path = input_path.replace(".glb", "_draco.glb")

        result = subprocess.run(
            [gltfpack, "-i", input_path, "-o", output_path, "-cc"],
            capture_output=True, text=True, timeout=120,
        )

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                compressed = f.read()
            ratio = len(compressed) / len(glb_bytes) * 100
            logger.info(f"Draco: {len(glb_bytes)} -> {len(compressed)} bytes ({ratio:.0f}%)")
            return compressed
        else:
            logger.warning(f"gltfpack failed: {result.stderr[:200]}")
    except Exception as e:
        logger.warning(f"Draco compression error: {e}")
    finally:
        for p in [input_path, output_path]:
            try:
                os.unlink(p)
            except OSError:
                pass

    return glb_bytes


def _find_gltfpack() -> Optional[str]:
    for path in ["/usr/local/bin/gltfpack", "/usr/bin/gltfpack", "gltfpack"]:
        try:
            subprocess.run([path, "--help"], capture_output=True, timeout=5)
            return path
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            continue
    return None
