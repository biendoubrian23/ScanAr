"""
Export utilities for GLB → USDZ conversion.
With Approach B, GLB is produced by the Hunyuan3D API server.
This module handles the USDZ conversion fallback locally.
"""

import os
import tempfile
from typing import Optional

from utils.logger import logger


def convert_glb_to_usdz(glb_bytes: bytes) -> Optional[bytes]:
    """Convert GLB bytes to USDZ. Returns None if conversion fails."""
    usdz = _try_trimesh_usdz(glb_bytes)
    if usdz:
        return usdz

    usdz = _try_pxr_usdz(glb_bytes)
    if usdz:
        return usdz

    logger.warning("All USDZ conversion methods failed")
    return None


def _try_trimesh_usdz(glb_bytes: bytes) -> Optional[bytes]:
    try:
        import trimesh

        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
            tmp.write(glb_bytes)
            tmp_path = tmp.name

        scene = trimesh.load(tmp_path)
        os.unlink(tmp_path)

        usdz_data = scene.export(file_type="usdz")
        if usdz_data and len(usdz_data) > 100:
            logger.info(f"USDZ via trimesh: {len(usdz_data)} bytes")
            return usdz_data
    except Exception as e:
        logger.debug(f"trimesh USDZ failed: {e}")

    return None


def _try_pxr_usdz(glb_bytes: bytes) -> Optional[bytes]:
    try:
        import trimesh
        from pxr import Usd, UsdGeom, UsdUtils, Sdf, Gf, Vt
        import numpy as np

        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
            tmp.write(glb_bytes)
            tmp_path = tmp.name

        scene = trimesh.load(tmp_path)
        os.unlink(tmp_path)

        if isinstance(scene, trimesh.Scene):
            mesh = trimesh.util.concatenate(list(scene.geometry.values()))
        else:
            mesh = scene

        with tempfile.TemporaryDirectory() as tmpdir:
            usdc_path = os.path.join(tmpdir, "model.usdc")
            usdz_path = os.path.join(tmpdir, "model.usdz")

            stage = Usd.Stage.CreateNew(usdc_path)
            UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)

            mesh_prim = UsdGeom.Mesh.Define(stage, "/root/mesh")
            verts = [Gf.Vec3f(float(v[0]), float(v[1]), float(v[2])) for v in mesh.vertices]
            mesh_prim.GetPointsAttr().Set(Vt.Vec3fArray(verts))
            mesh_prim.GetFaceVertexCountsAttr().Set(Vt.IntArray([3] * len(mesh.faces)))
            mesh_prim.GetFaceVertexIndicesAttr().Set(Vt.IntArray(mesh.faces.flatten().tolist()))

            stage.GetRootLayer().Save()
            UsdUtils.CreateNewUsdzPackage(Sdf.AssetPath(usdc_path), usdz_path)

            with open(usdz_path, "rb") as f:
                usdz_data = f.read()

            logger.info(f"USDZ via pxr: {len(usdz_data)} bytes")
            return usdz_data

    except ImportError:
        logger.debug("pxr not available")
    except Exception as e:
        logger.debug(f"pxr USDZ failed: {e}")

    return None
