import base64
import io
import os
import subprocess
import tempfile
from typing import Optional, Union

import httpx

from utils.logger import logger

HUNYUAN3D_API_URL = os.getenv("HUNYUAN3D_API_URL", "http://hunyuan3d:8080")
# Full-quality model + 30 steps + octree 256 + 100k faces takes well over 5 min.
# Default 15 min — override via HUNYUAN3D_TIMEOUT env var if needed.
REQUEST_TIMEOUT = int(os.getenv("HUNYUAN3D_TIMEOUT", "900"))


async def check_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{HUNYUAN3D_API_URL}/health")
            return resp.status_code == 200
    except Exception:
        return False


async def generate_3d_from_images(
    image_blobs: Union[bytes, list[bytes]],
    with_texture: bool = True,
) -> dict:
    """
    Calls the Hunyuan3D API server to generate a textured 3D model.

    Accepts 1..4 images:
      - 1 image  → single-view diffusion (image=<b64>)
      - 2..4     → multi-view diffusion  (image=[<b64>, <b64>, ...])
                   First image is the front view, the rest fill back/left/right.

    Backward-compatible: a raw bytes input is treated as a 1-image list.
    Returns: {"glb_bytes": <binary GLB>}
    """
    # Normalise to list[bytes]
    if isinstance(image_blobs, (bytes, bytearray)):
        blobs = [bytes(image_blobs)]
    else:
        blobs = list(image_blobs)

    if not blobs:
        raise ValueError("No image data provided")
    if len(blobs) > 4:
        raise ValueError(f"Maximum 4 images supported, got {len(blobs)}")

    image_b64_list = [base64.b64encode(d).decode("utf-8") for d in blobs]

    # Single-image: send `image` as string for full backward compat.
    # Multi-image:  send `image` as list (handled by patched api_server.py).
    image_field = image_b64_list[0] if len(image_b64_list) == 1 else image_b64_list

    payload = {
        "image": image_field,
        "texture": with_texture,
        "seed": 1234,
    }

    logger.info(
        f"Calling Hunyuan3D API at {HUNYUAN3D_API_URL}/generate "
        f"(views={len(blobs)}, texture={with_texture})"
    )

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


# Legacy alias kept for any callers that might still pass a single bytes blob.
async def generate_3d_from_image(image_data: bytes, with_texture: bool = True) -> dict:
    return await generate_3d_from_images([image_data], with_texture=with_texture)


async def generate_3d_with_usdz(image_blobs: Union[bytes, list[bytes]]) -> dict:
    """
    Generates GLB via Hunyuan3D API, then converts to USDZ locally.
    Falls back gracefully if USDZ conversion fails.
    """
    result = await generate_3d_from_images(image_blobs, with_texture=True)
    glb_bytes = result["glb_bytes"]

    usdz_bytes = _local_usdz_convert(glb_bytes)

    return {
        "glb_bytes": glb_bytes,
        "usdz_bytes": usdz_bytes,
    }


_BLENDER_CONVERT_SCRIPT = """\
import bpy, sys
args = sys.argv[sys.argv.index("--") + 1:]
glb_path, usdz_path = args[0], args[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)
bpy.ops.wm.usd_export(filepath=usdz_path, export_textures=True, overwrite_textures=True)
"""


def _local_usdz_convert(glb_bytes: bytes) -> Optional[bytes]:
    """Convert GLB → USDZ using Blender CLI (headless)."""
    blender = _find_blender()
    if blender is None:
        logger.warning("Blender not found — skipping USDZ conversion")
        return None

    glb_path = usdz_path = script_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as f:
            f.write(glb_bytes)
            glb_path = f.name

        usdz_path = glb_path.replace(".glb", ".usdz")
        script_path = glb_path.replace(".glb", "_usdz.py")
        with open(script_path, "w") as f:
            f.write(_BLENDER_CONVERT_SCRIPT)

        result = subprocess.run(
            [blender, "--background", "--python", script_path, "--", glb_path, usdz_path],
            capture_output=True, text=True, timeout=180,
        )

        if result.returncode == 0 and os.path.exists(usdz_path):
            with open(usdz_path, "rb") as f:
                data = f.read()
            if len(data) > 100:
                logger.info(f"USDZ conversion OK: {len(data)} bytes")
                return data
        logger.warning(f"Blender USDZ failed (rc={result.returncode}): {result.stderr[-300:]}")

    except Exception as e:
        logger.warning(f"Blender USDZ conversion error: {e}")
    finally:
        for p in (glb_path, usdz_path, script_path):
            if p:
                try: os.unlink(p)
                except OSError: pass

    return None


def _find_blender() -> Optional[str]:
    for path in ["/usr/local/bin/blender", "/usr/bin/blender", "blender"]:
        try:
            r = subprocess.run([path, "--version"], capture_output=True, timeout=5)
            if r.returncode == 0:
                return path
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            continue
    return None
