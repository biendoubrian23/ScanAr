import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import httpx
_orig = httpx.Client.__init__
def _patched(self, *a, **kw):
    kw["verify"] = False
    _orig(self, *a, **kw)
httpx.Client.__init__ = _patched

import os
os.environ["HF_HUB_DISABLE_XET"] = "1"

from huggingface_hub import snapshot_download

print("=== Downloading tencent/Hunyuan3D-2mini (shape model) ===")
snapshot_download("tencent/Hunyuan3D-2mini", cache_dir="/root/.cache/huggingface/hub")
print("=== DONE: Hunyuan3D-2mini ===")

print("=== Downloading tencent/Hunyuan3D-2 (texture model) ===")
snapshot_download("tencent/Hunyuan3D-2", cache_dir="/root/.cache/huggingface/hub")
print("=== ALL DOWNLOADS COMPLETE ===")
