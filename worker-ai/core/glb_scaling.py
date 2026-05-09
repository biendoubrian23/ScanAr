"""
Apply real-world scale to a Hunyuan3D-generated GLB.

The downstream <model-viewer ar-scale="fixed"> displays the model at the size
encoded in the GLB itself (glTF default unit = metre). Hunyuan3D output is in
arbitrary units, so we rescale uniformly to match the GPT-estimated dimensions
while preserving the mesh's aspect ratio (which carries the visual quality of
the reconstruction).

Anchor: scale on the LARGEST real dimension. This avoids amplifying error on
smaller axes (where GPT estimates are noisier) and guarantees the model fills
its expected real bounding box on at least one axis.
"""

import io

import numpy as np
import trimesh

from utils.logger import logger


def apply_real_scale(glb_bytes: bytes, real_dims_cm: dict) -> bytes:
    """Uniformly scale the GLB to match the longest real-world dimension.

    Returns the original bytes on any error — the pipeline must keep producing
    a usable GLB. The scaling factor is computed from the longest GLB extent
    versus the longest real dimension to preserve aspect ratio."""
    try:
        scene = trimesh.load(io.BytesIO(glb_bytes), file_type="glb")

        bounds = scene.bounds  # 2x3
        extents_m = np.asarray(bounds[1]) - np.asarray(bounds[0])
        current_max_m = float(np.max(extents_m))
        if current_max_m <= 1e-9:
            logger.warning("[scale] GLB has zero extent — skipping")
            return glb_bytes

        real_max_cm = max(
            float(real_dims_cm.get("width_cm",  0) or 0),
            float(real_dims_cm.get("height_cm", 0) or 0),
            float(real_dims_cm.get("depth_cm",  0) or 0),
        )
        if real_max_cm <= 0:
            logger.warning("[scale] no positive real dimension — skipping")
            return glb_bytes

        target_max_m = real_max_cm / 100.0
        factor = target_max_m / current_max_m

        scene.apply_transform(trimesh.transformations.scale_matrix(factor))

        out = scene.export(file_type="glb")
        if isinstance(out, str):
            out = out.encode("utf-8")
        logger.info(
            f"[scale] {current_max_m*100:.1f}cm → {target_max_m*100:.1f}cm "
            f"(factor={factor:.3f}, {len(glb_bytes)}→{len(out)} bytes)"
        )
        return bytes(out)
    except Exception as e:
        logger.warning(f"[scale] failed ({type(e).__name__}: {e}) — keeping unscaled GLB")
        return glb_bytes
