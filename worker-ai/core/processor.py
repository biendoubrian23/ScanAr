import io
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


# Pipeline step definitions — kept in sync with frontend PIPELINE_STEPS
STEP_DOWNLOAD = "downloading_image"
STEP_SHAPE    = "generating_shape"
STEP_TEXTURE  = "generating_texture"
STEP_COMPRESS = "compressing"
STEP_UPLOAD   = "uploading_assets"


async def download_image(image_url: str) -> bytes:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
        return resp.content


def _extract_glb_metadata(glb_bytes: bytes) -> dict:
    """
    Extract polygons / materials / bounding box (mm) from a GLB binary.

    Returns {} if trimesh fails to parse — the pipeline must remain resilient.
    Sizes are converted from glTF units (assumed metres) to millimetres.
    """
    try:
        import trimesh

        scene = trimesh.load(io.BytesIO(glb_bytes), file_type="glb")

        polygons = 0
        materials = set()
        if hasattr(scene, "geometry") and scene.geometry:
            for geom in scene.geometry.values():
                if hasattr(geom, "faces"):
                    polygons += len(geom.faces)
                if hasattr(geom, "visual") and getattr(geom.visual, "material", None) is not None:
                    materials.add(id(geom.visual.material))
        elif hasattr(scene, "faces"):
            polygons = len(scene.faces)

        try:
            bounds = scene.bounds  # 2x3 array
            extents = bounds[1] - bounds[0]
            dims_mm = {
                "x": round(float(extents[0]) * 1000, 1),
                "y": round(float(extents[1]) * 1000, 1),
                "z": round(float(extents[2]) * 1000, 1),
            }
        except Exception:
            dims_mm = None

        return {
            "polygons": int(polygons) if polygons else None,
            "materials_count": len(materials) if materials else None,
            "dimensions_mm": dims_mm,
        }
    except Exception as e:
        logger.warning(f"GLB metadata extraction failed: {e}")
        return {}


async def process_image_to_3d(
    model_id: str,
    user_id: str,
    image_url: str,
    image_path: str,
    step_callback: Optional[Callable] = None,
) -> dict:
    """
    Process an image into a 3D GLB+USDZ asset.

    `step_callback(step, progress, status="started"|"done"|"failed", message=None)`
    is invoked at every phase boundary so the frontend can render a live stepper.
    """
    supabase = get_admin_client()

    async def emit(step: str, progress: int, status: str = "started", message: str = None):
        if step_callback:
            await step_callback(step, progress, status, message)

    # ── 1. Download source image ────────────────────────────────────────
    await emit(STEP_DOWNLOAD, 5, "started")
    logger.info(f"Downloading source image: {image_url}")
    image_data = await download_image(image_url)
    logger.info(f"Image downloaded: {len(image_data)} bytes")
    await emit(STEP_DOWNLOAD, 10, "done")

    # ── 2. Shape generation (Hunyuan3D shape model) ─────────────────────
    await emit(STEP_SHAPE, 15, "started")
    from core.hunyuan import generate_3d_with_usdz

    # ── 3. Texture generation happens inside generate_3d_with_usdz ─────
    # We emit the texture step as "started" immediately so the UI shows it
    # rolling; on done we'll mark both shape+texture done.
    await emit(STEP_TEXTURE, 35, "started")

    result = await generate_3d_with_usdz(image_data)
    glb_bytes = result["glb_bytes"]
    usdz_bytes = result.get("usdz_bytes")

    await emit(STEP_SHAPE,   70, "done")
    await emit(STEP_TEXTURE, 75, "done")

    # ── 4. Draco compression ────────────────────────────────────────────
    if ENABLE_DRACO:
        await emit(STEP_COMPRESS, 78, "started")
        glb_bytes = _compress_draco(glb_bytes)
        await emit(STEP_COMPRESS, 82, "done")

    # ── 5. Upload to storage ────────────────────────────────────────────
    await emit(STEP_UPLOAD, 85, "started")

    glb_path = f"{user_id}/{model_id}.glb"
    supabase.storage.from_(GLB_BUCKET).upload(
        path=glb_path,
        file=glb_bytes,
        file_options={"content-type": "model/gltf-binary"},
    )
    glb_url = f"{SUPABASE_URL}/storage/v1/object/public/{GLB_BUCKET}/{glb_path}"
    logger.info(f"GLB uploaded: {glb_path} ({len(glb_bytes)} bytes)")

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

    await emit(STEP_UPLOAD, 100, "done")

    meta = _extract_glb_metadata(glb_bytes)

    return {
        "glb_url": glb_url,
        "glb_path": glb_path,
        "usdz_url": usdz_url,
        "usdz_path": usdz_path,
        "file_size_bytes": len(glb_bytes),
        "polygons": meta.get("polygons"),
        "materials_count": meta.get("materials_count"),
        "dimensions_mm": meta.get("dimensions_mm"),
    }


def _compress_draco(glb_bytes: bytes) -> bytes:
    gltfpack = _find_gltfpack()
    if gltfpack is None:
        return glb_bytes

    input_path = None
    output_path = None
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
        for p in (input_path, output_path):
            if p:
                try: os.unlink(p)
                except OSError: pass

    return glb_bytes


def _find_gltfpack() -> Optional[str]:
    for path in ["/usr/local/bin/gltfpack", "/usr/bin/gltfpack", "gltfpack"]:
        try:
            subprocess.run([path, "--help"], capture_output=True, timeout=5)
            return path
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            continue
    return None
