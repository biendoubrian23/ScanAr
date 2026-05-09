import io
import os
import subprocess
import tempfile
import time
from typing import Callable, Optional

import httpx

from utils.logger import logger
from utils.supabase_client import get_admin_client


def _upload_with_retry(bucket: str, path: str, data: bytes, content_type: str, attempts: int = 3) -> None:
    """Upload `data` to Supabase Storage at `bucket/path`, retrying on transient
    network/timeout errors. Raises the last exception if all attempts fail."""
    supabase = get_admin_client()
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            supabase.storage.from_(bucket).upload(
                path=path,
                file=data,
                file_options={"content-type": content_type},
            )
            return
        except (httpx.ReadTimeout, httpx.WriteTimeout, httpx.ConnectTimeout, httpx.RemoteProtocolError) as e:
            last_exc = e
            logger.warning(f"Upload to {bucket}/{path} attempt {attempt}/{attempts} failed: {e}")
            if attempt < attempts:
                time.sleep(2 ** (attempt - 1))  # 1s, 2s, 4s
        except Exception as e:
            # Non-retryable (auth, validation, conflict) — fail fast
            raise
    assert last_exc is not None
    raise last_exc

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
GLB_BUCKET = "models-glb"
USDZ_BUCKET = "models-usdz"
ENHANCED_BUCKET = "images-enhanced"
ENABLE_DRACO = os.getenv("ENABLE_DRACO", "true").lower() == "true"


# Pipeline step definitions — kept in sync with frontend PIPELINE_STEPS
STEP_DOWNLOAD = "downloading_image"
STEP_ENHANCE  = "enhancing_image"
STEP_VIEWS    = "completing_views"
STEP_SIZE     = "estimating_size"
STEP_SHAPE    = "generating_shape"
STEP_TEXTURE  = "generating_texture"
STEP_CLEANUP  = "cleaning_mesh"
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


async def process_images_to_3d(
    model_id: str,
    user_id: str,
    image_urls: list[str],
    image_paths: Optional[list[str]] = None,
    step_callback: Optional[Callable] = None,
    gpt_enhance_enabled: bool = True,
    use_tripo: bool = True,
) -> dict:
    """
    Process 1..4 images into a 3D GLB+USDZ asset (multi-view reconstruction).

    The first URL is the front view (driver image); additional images become
    back/left/right views fed to the generator via multiview.

    `step_callback(step, progress, status="started"|"done"|"failed", message=None)`
    is invoked at every phase boundary so the frontend can render a live stepper.

    `gpt_enhance_enabled` (per-user) gates the gpt-image-1 enhancement + gpt-4o
    view completion. Size estimation always runs.

    `use_tripo` (per-user) routes the actual 3D generation:
      - True  → Tripo3D cloud API (P1 model, image_to_model or multiview_to_model)
      - False → local Hunyuan3D Docker service (legacy/dev path)
    """
    supabase = get_admin_client()

    async def emit(step: str, progress: int, status: str = "started", message: str = None):
        if step_callback:
            await step_callback(step, progress, status, message)

    # ── 1. Download source images (parallel) ────────────────────────────
    await emit(STEP_DOWNLOAD, 5, "started")
    logger.info(f"Downloading {len(image_urls)} source image(s)")

    import asyncio as _asyncio
    image_blobs = await _asyncio.gather(*(download_image(u) for u in image_urls))
    total_bytes = sum(len(b) for b in image_blobs)
    logger.info(f"Images downloaded: {len(image_blobs)} files, {total_bytes} bytes total")
    await emit(STEP_DOWNLOAD, 10, "done")

    enhanced_paths: list[str | None] = []
    enhanced_urls: list[str | None] = []

    if gpt_enhance_enabled:
        # ── 1bis. AI enhancement via gpt-image-1 (parallel, original-on-failure) ─
        await emit(STEP_ENHANCE, 11, "started")
        from core.image_enhance import enhance_images
        enhance_results = await enhance_images(image_blobs)
        enhanced_count = sum(1 for r in enhance_results if r.enhanced)
        fallback_count = sum(1 for r in enhance_results if r.used_fallback)
        image_blobs = [r.image_bytes for r in enhance_results]
        logger.info(
            f"Enhancement: {enhanced_count}/{len(enhance_results)} enhanced "
            f"(fallback key used on {fallback_count})"
        )

        # Persist successfully enhanced images to the public bucket so the dashboard
        # can show a before/after toggle. Failed-enhancement entries (originals)
        # are NOT uploaded — the frontend simply shows the original at that index.
        for idx, r in enumerate(enhance_results):
            if not r.enhanced:
                enhanced_paths.append(None)
                enhanced_urls.append(None)
                continue
            path = f"{user_id}/{model_id}/{idx}.png"
            try:
                supabase.storage.from_(ENHANCED_BUCKET).upload(
                    path=path,
                    file=r.image_bytes,
                    file_options={"content-type": "image/png", "upsert": "true"},
                )
                url = f"{SUPABASE_URL}/storage/v1/object/public/{ENHANCED_BUCKET}/{path}"
                enhanced_paths.append(path)
                enhanced_urls.append(url)
                logger.info(f"Enhanced image #{idx} uploaded: {path} ({len(r.image_bytes)} bytes)")
            except Exception as e:
                logger.warning(f"Enhanced image #{idx} upload failed: {e}")
                enhanced_paths.append(None)
                enhanced_urls.append(None)

        await emit(
            STEP_ENHANCE, 14, "done",
            f"{enhanced_count}/{len(enhance_results)} images améliorées"
            + (f" ({fallback_count} via clé fallback)" if fallback_count else ""),
        )

        # ── 1ter. Multi-view completion (gpt-4o vision + gpt-image-1) ───────
        await emit(STEP_VIEWS, 15, "started")
        from core.view_completion import complete_views
        n_orig = len(image_blobs)
        vc = await complete_views(image_blobs)
        image_blobs = vc.images
        if vc.generated_views:
            msg = f"{len(vc.generated_views)} vue(s) générée(s) : {', '.join(vc.generated_views)}"
        elif vc.analysis:
            msg = "Vues complètes — pas de génération"
        else:
            msg = "Analyse ignorée"
        logger.info(f"View completion done: {len(image_blobs)} total image(s) → Hunyuan3D")

        # Persist GPT-generated views to the same bucket so the dashboard's
        # "Améliorée" tab shows EVERY image fed to Hunyuan3D (cleaned originals
        # + AI-generated angles).
        for offset, view in enumerate(vc.generated_views):
            idx = n_orig + offset
            if idx >= len(image_blobs):
                break
            path = f"{user_id}/{model_id}/gen_{view}.png"
            try:
                supabase.storage.from_(ENHANCED_BUCKET).upload(
                    path=path,
                    file=image_blobs[idx],
                    file_options={"content-type": "image/png", "upsert": "true"},
                )
                url = f"{SUPABASE_URL}/storage/v1/object/public/{ENHANCED_BUCKET}/{path}"
                enhanced_paths.append(path)
                enhanced_urls.append(url)
                logger.info(f"Generated view '{view}' uploaded: {path} ({len(image_blobs[idx])} bytes)")
            except Exception as e:
                logger.warning(f"Generated view '{view}' upload failed: {e}")
                enhanced_paths.append(None)
                enhanced_urls.append(None)

        await emit(STEP_VIEWS, 17, "done", msg)
    else:
        # User disabled GPT enhancement — feed originals straight to Hunyuan3D.
        # The "Améliorée" gallery in the dashboard simply shows nothing.
        logger.info("GPT enhancement DISABLED by user — using originals only")
        await emit(STEP_ENHANCE, 14, "done", "Amélioration IA désactivée")
        await emit(STEP_VIEWS,   17, "done", "Génération de vues désactivée")

    # ── 1quater. Real-world size estimation (gpt-4o-mini, ALWAYS on) ─────
    # Estimates dimensions in cm for AR fixed-scale display. Runs on the first
    # available image — enhanced if available (cleaner = better identification),
    # original otherwise. Returns None on failure; pipeline continues unscaled.
    await emit(STEP_SIZE, 17, "started")
    from core.size_estimation import estimate_real_size
    size_estimate = await estimate_real_size(image_blobs[0])
    real_dimensions_cm = size_estimate.to_dict() if size_estimate else None
    if size_estimate:
        size_msg = (
            f"{size_estimate.object_label} : "
            f"{size_estimate.width_cm:.0f}×{size_estimate.height_cm:.0f}×"
            f"{size_estimate.depth_cm:.0f} cm"
        )
    else:
        size_msg = "Estimation indisponible — affichage AR auto-scale"
    await emit(STEP_SIZE, 18, "done", size_msg)

    # ── 2. Shape generation (Tripo3D cloud OR local Hunyuan3D) ──────────
    await emit(STEP_SHAPE, 18, "started")
    await emit(STEP_TEXTURE, 40, "started")

    tripo_credits_used = 0
    tripo_task_id: Optional[str] = None

    if use_tripo:
        # Tripo handles geometry + texture in one call. Progress is polled.
        from core.tripo import generate_3d_with_usdz as tripo_generate

        async def _tripo_progress(p: int):
            # Map Tripo 0-100 to our pipeline range 18-72 (between shape start and texture done)
            mapped = 18 + int(p * 0.54)
            await emit(STEP_SHAPE, max(19, min(64, mapped)), "started")

        result = await tripo_generate(image_blobs, progress_cb=_tripo_progress)
        glb_bytes = result["glb_bytes"]
        usdz_bytes = result.get("usdz_bytes")  # Tripo client returns None — we generate USDZ post-hoc
        tripo_credits_used = int(result.get("consumed_credits", 0) or 0)
        tripo_task_id = result.get("task_id")
        logger.info(f"[processor] Tripo done — credits={tripo_credits_used} task={tripo_task_id}")
    else:
        from core.hunyuan import generate_3d_with_usdz as hunyuan_generate
        result = await hunyuan_generate(image_blobs)
        glb_bytes = result["glb_bytes"]
        usdz_bytes = result.get("usdz_bytes")

    await emit(STEP_SHAPE,   65, "done")
    await emit(STEP_TEXTURE, 72, "done")

    # Tripo doesn't bundle USDZ — convert via Blender like the Hunyuan path does.
    if use_tripo and usdz_bytes is None:
        try:
            from core.hunyuan import _local_usdz_convert
            usdz_bytes = _local_usdz_convert(glb_bytes)
        except Exception as e:
            logger.warning(f"[processor] USDZ conversion skipped: {e}")

    # ── 3bis. Mesh cleanup (outlier removal + Taubin smoothing) ─────────
    # Tripo P1 produces clean low-poly topology by design and HD-textured GLBs
    # can cause trimesh native segfaults during cleanup. Skip the step entirely
    # when generation came from Tripo — only Hunyuan3D's noisy output needs it.
    await emit(STEP_CLEANUP, 74, "started")
    if use_tripo:
        logger.info("Mesh cleanup: skipped (Tripo output is already clean)")
        await emit(STEP_CLEANUP, 77, "done", "Skipped — Tripo mesh already clean")
    else:
        from core.mesh_cleanup import cleanup_glb
        glb_bytes = cleanup_glb(glb_bytes)
        await emit(STEP_CLEANUP, 77, "done")

    # ── 3ter. Apply real-world scale (silent — no separate UI step) ──────
    # The GLB now has correct geometry but arbitrary units. Scale uniformly so
    # its longest extent matches the longest GPT-estimated real dimension —
    # required for <model-viewer ar-scale="fixed"> to render at real size.
    if real_dimensions_cm:
        from core.glb_scaling import apply_real_scale
        glb_bytes = apply_real_scale(glb_bytes, real_dimensions_cm)

    # ── 4. Draco compression ────────────────────────────────────────────
    if ENABLE_DRACO:
        await emit(STEP_COMPRESS, 79, "started")
        glb_bytes = _compress_draco(glb_bytes)
        await emit(STEP_COMPRESS, 82, "done")

    # ── 5. Upload to storage ────────────────────────────────────────────
    await emit(STEP_UPLOAD, 85, "started")

    glb_path = f"{user_id}/{model_id}.glb"
    _upload_with_retry(GLB_BUCKET, glb_path, glb_bytes, "model/gltf-binary")
    glb_url = f"{SUPABASE_URL}/storage/v1/object/public/{GLB_BUCKET}/{glb_path}"
    logger.info(f"GLB uploaded: {glb_path} ({len(glb_bytes)} bytes)")

    usdz_url = None
    usdz_path = None
    if usdz_bytes:
        usdz_path = f"{user_id}/{model_id}.usdz"
        _upload_with_retry(USDZ_BUCKET, usdz_path, usdz_bytes, "model/vnd.usdz+zip")
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
        "real_dimensions_cm": real_dimensions_cm,
        "enhanced_image_paths": enhanced_paths,
        "enhanced_image_urls": enhanced_urls,
        "tripo_credits_used": tripo_credits_used,
        "tripo_task_id": tripo_task_id,
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
