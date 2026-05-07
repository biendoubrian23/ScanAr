"""
Post-Hunyuan3D mesh cleanup.

Two operations applied to the GLB before Draco compression:

1. Outlier removal — Hunyuan often hallucinates a small disconnected blob
   (the "ghost hand" artifact on top-down inputs). We split the mesh into
   connected components, keep the one with the largest bounding-box volume.

2. Light Taubin smoothing — gentle low-pass filter that removes the high-
   frequency spikes from the marching-cubes surface without shrinking the
   mesh (unlike pure Laplacian).

Both operations preserve UV coordinates and vertex colors. If something
fails we fall back to the original mesh — the pipeline must never abort.
"""

import io
from typing import Optional

import trimesh

from utils.logger import logger

MIN_VOLUME_RATIO = 0.05  # drop components < 5% of the largest's bbox volume
SMOOTH_ITERATIONS = 3
SMOOTH_LAMBDA = 0.5
SMOOTH_NU = -0.53      # Taubin: nu slightly negative cancels shrinkage

# Safety caps — beyond these, we skip cleanup to avoid OOM/segfaults of trimesh
# on texture-heavy GLBs. The mesh ships uncleaned but the pipeline survives.
#
# NOTE: cap is intentionally LOW (4 MB) because trimesh.load() itself segfaults
# on Hunyuan3D max-quality outputs (5-7 MB textured GLBs) — the segfault is in
# native code so try/except cannot catch it. The check MUST happen before
# trimesh.load() is even called. We trade away cleanup on big meshes to keep
# the worker alive — segfaults silently kill the whole process.
MAX_GLB_BYTES = 4 * 1024 * 1024     # 4 MB
MAX_TOTAL_FACES = 200_000           # combined across all sub-meshes


def _bbox_volume(mesh: trimesh.Trimesh) -> float:
    try:
        ext = mesh.bounding_box.extents
        return float(ext[0] * ext[1] * ext[2])
    except Exception:
        return 0.0


def _drop_outliers(scene_or_mesh) -> tuple:
    """
    Returns (cleaned_mesh_or_scene, removed_count).
    For a Scene with multiple geometries, processes each geometry separately.
    For a single Trimesh, splits and keeps the dominant component.
    """
    removed = 0

    if isinstance(scene_or_mesh, trimesh.Scene):
        new_geometries = {}
        for name, geom in scene_or_mesh.geometry.items():
            if not isinstance(geom, trimesh.Trimesh):
                new_geometries[name] = geom
                continue
            cleaned, n = _drop_outliers_single(geom)
            new_geometries[name] = cleaned
            removed += n
        scene_or_mesh.geometry.clear()
        for name, geom in new_geometries.items():
            scene_or_mesh.add_geometry(geom, geom_name=name)
        return scene_or_mesh, removed

    cleaned, removed = _drop_outliers_single(scene_or_mesh)
    return cleaned, removed


def _drop_outliers_single(mesh: trimesh.Trimesh) -> tuple:
    parts = mesh.split(only_watertight=False)
    if len(parts) <= 1:
        return mesh, 0

    volumes = [_bbox_volume(p) for p in parts]
    max_v = max(volumes)
    if max_v == 0:
        return mesh, 0

    kept = [p for p, v in zip(parts, volumes) if v >= max_v * MIN_VOLUME_RATIO]
    removed = len(parts) - len(kept)
    if not kept:
        return mesh, 0

    if len(kept) == 1:
        return kept[0], removed
    return trimesh.util.concatenate(kept), removed


def _smooth(scene_or_mesh):
    """In-place Taubin smoothing on every Trimesh in a Scene (or the mesh itself)."""
    targets = []
    if isinstance(scene_or_mesh, trimesh.Scene):
        targets = [g for g in scene_or_mesh.geometry.values() if isinstance(g, trimesh.Trimesh)]
    elif isinstance(scene_or_mesh, trimesh.Trimesh):
        targets = [scene_or_mesh]

    for m in targets:
        try:
            trimesh.smoothing.filter_taubin(
                m,
                lamb=SMOOTH_LAMBDA,
                nu=SMOOTH_NU,
                iterations=SMOOTH_ITERATIONS,
            )
        except Exception as e:
            logger.warning(f"Taubin smoothing skipped on a sub-mesh: {e}")


def _total_faces(scene_or_mesh) -> int:
    if isinstance(scene_or_mesh, trimesh.Scene):
        return sum(len(g.faces) for g in scene_or_mesh.geometry.values()
                   if isinstance(g, trimesh.Trimesh))
    if isinstance(scene_or_mesh, trimesh.Trimesh):
        return len(scene_or_mesh.faces)
    return 0


def cleanup_glb(glb_bytes: bytes) -> bytes:
    """
    Apply outlier removal + Taubin smoothing to a GLB.
    Returns the cleaned GLB bytes (or original on any failure / size cap hit).

    Safety caps protect the worker from OOM and trimesh segfaults on very
    large texture-heavy meshes — those are returned untouched.
    """
    if len(glb_bytes) > MAX_GLB_BYTES:
        logger.info(
            f"Mesh cleanup: GLB too large ({len(glb_bytes)} > {MAX_GLB_BYTES} bytes), "
            f"skipping to avoid OOM"
        )
        return glb_bytes

    try:
        scene = trimesh.load(io.BytesIO(glb_bytes), file_type="glb")

        faces = _total_faces(scene)
        if faces > MAX_TOTAL_FACES:
            logger.info(
                f"Mesh cleanup: too many faces ({faces} > {MAX_TOTAL_FACES}), "
                f"skipping to avoid OOM/segfault"
            )
            return glb_bytes

        cleaned, removed = _drop_outliers(scene)
        if removed:
            logger.info(f"Mesh cleanup: dropped {removed} outlier component(s)")
        _smooth(cleaned)

        buf = io.BytesIO()
        cleaned.export(buf, file_type="glb")
        out = buf.getvalue()

        if len(out) < 100:
            logger.warning("Cleanup produced an empty GLB — keeping original")
            return glb_bytes

        logger.info(f"Mesh cleanup OK: {len(glb_bytes)} → {len(out)} bytes ({faces} faces)")
        return out
    except Exception as e:
        logger.warning(f"Mesh cleanup failed ({e}); keeping original GLB")
        return glb_bytes
