"""
Mesh post-processing utilities.
With Approach B (API Server), most mesh processing is handled by the Hunyuan3D
server itself. This module provides optional local operations if needed.
"""

import os
import subprocess
import tempfile
from typing import Optional

from utils.logger import logger


def compress_draco(glb_bytes: bytes) -> bytes:
    gltfpack = _find_gltfpack()
    if gltfpack is None:
        logger.warning("gltfpack not found, skipping Draco compression")
        return glb_bytes

    with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as f_in:
        f_in.write(glb_bytes)
        input_path = f_in.name

    output_path = input_path.replace(".glb", "_draco.glb")

    try:
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
            return glb_bytes
    except Exception as e:
        logger.warning(f"Draco error: {e}")
        return glb_bytes
    finally:
        for p in [input_path, output_path]:
            try:
                os.unlink(p)
            except OSError:
                pass


def _find_gltfpack() -> Optional[str]:
    for path in ["/usr/local/bin/gltfpack", "/usr/bin/gltfpack", "gltfpack"]:
        try:
            subprocess.run([path, "--help"], capture_output=True, timeout=5)
            return path
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            continue
    return None
