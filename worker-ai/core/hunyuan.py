import base64
import io
import os
import tempfile
from typing import Optional

import httpx

from utils.logger import logger

HUNYUAN3D_API_URL = os.getenv("HUNYUAN3D_API_URL", "http://hunyuan3d:8080")
REQUEST_TIMEOUT = int(os.getenv("HUNYUAN3D_TIMEOUT", "300"))


async def check_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{HUNYUAN3D_API_URL}/health")
            return resp.status_code == 200
    except Exception:
        return False


async def generate_3d_from_image(image_data: bytes, with_texture: bool = True) -> dict:
    """
    Calls the Hunyuan3D API server to generate a textured 3D model from an image.
    API: POST /generate {"image": "<base64>", "texture": true}
    Returns: binary GLB content
    """
    logger.info(f"Calling Hunyuan3D API at {HUNYUAN3D_API_URL}/generate (texture={with_texture})")

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    payload = {
        "image": image_b64,
        "texture": with_texture,
        "seed": 1234,
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(
            f"{HUNYUAN3D_API_URL}/generate",
            json=payload,
        )

        if resp.status_code != 200:
            error_detail = resp.text[:500]
            raise RuntimeError(f"Hunyuan3D API error {resp.status_code}: {error_detail}")

        glb_bytes = resp.content

        if len(glb_bytes) < 100:
            raise RuntimeError(f"GLB response too small ({len(glb_bytes)} bytes), likely invalid")

        logger.info(f"Received GLB: {len(glb_bytes)} bytes")
        return {"glb_bytes": glb_bytes}


async def generate_3d_with_usdz(image_data: bytes) -> dict:
    """
    Generates GLB via Hunyuan3D API, then converts to USDZ locally.
    Falls back gracefully if USDZ conversion fails.
    """
    result = await generate_3d_from_image(image_data, with_texture=True)
    glb_bytes = result["glb_bytes"]

    usdz_bytes = _local_usdz_convert(glb_bytes)

    return {
        "glb_bytes": glb_bytes,
        "usdz_bytes": usdz_bytes,
    }


def _local_usdz_convert(glb_bytes: bytes) -> Optional[bytes]:
    """Attempt local GLB → USDZ conversion via trimesh."""
    try:
        import trimesh

        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
            tmp.write(glb_bytes)
            tmp_path = tmp.name

        scene = trimesh.load(tmp_path)
        os.unlink(tmp_path)

        usdz_data = scene.export(file_type="usdz")
        if usdz_data and len(usdz_data) > 100:
            logger.info(f"USDZ conversion OK: {len(usdz_data)} bytes")
            return usdz_data
    except ImportError:
        logger.warning("trimesh not available for USDZ conversion")
    except Exception as e:
        logger.warning(f"USDZ conversion failed: {e}")

    return None
