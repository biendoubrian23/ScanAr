"""
Patch /app/Hunyuan3D-2/api_server.py to:
  1. Accept multi-view input — `image` may be a list[str] of length 1..4.
     First element = front view; elements 2..4 = back / left / right.
  2. Build a view dict for the 2mv pipeline (expects {"front": PIL, ...}).
  3. Expose --subfolder CLI argument and forward it to ModelWorker.
"""

import sys
from pathlib import Path

API_SERVER = Path("/app/Hunyuan3D-2/api_server.py")

# ── Patch 1: parse multi-view input list ─────────────────────────────────────
GEN_OLD = """    @torch.inference_mode()
    def generate(self, uid, params):
        if 'image' in params:
            image = params["image"]
            image = load_image_from_base64(image)
        else:"""

GEN_NEW = """    @torch.inference_mode()
    def generate(self, uid, params):
        if 'image' in params:
            img_input = params["image"]
            if isinstance(img_input, list):
                # Multi-view: first = front view, rest = back/left/right
                pil_images = [load_image_from_base64(b) for b in img_input if b]
                if not pil_images:
                    raise ValueError("Empty image list")
                image = pil_images[0]
                if len(pil_images) >= 2:
                    view_keys = ["back", "left", "right"]
                    params['_mv_extra'] = {
                        view_keys[i]: self.rembg(pil_images[i + 1])
                        for i in range(min(len(pil_images) - 1, 3))
                    }
            else:
                image = load_image_from_base64(img_input)
        else:"""

# ── Patch 2: build image dict for 2mv pipeline (expects {"front": PIL, ...}) ─
# MVImageProcessorV2.__call__ requires a dict, not a bare PIL Image.
IMG_OLD = """        image = self.rembg(image)
        params['image'] = image"""

IMG_NEW = """        image = self.rembg(image)
        img_dict = {"front": image}
        img_dict.update(params.pop("_mv_extra", {}))
        params['image'] = img_dict"""

# ── Patch 3: add --subfolder CLI argument ─────────────────────────────────────
ARG_OLD = """    parser.add_argument("--model_path", type=str, default='tencent/Hunyuan3D-2mini')
    parser.add_argument("--tex_model_path", type=str, default='tencent/Hunyuan3D-2')"""

ARG_NEW = """    parser.add_argument("--model_path", type=str, default='tencent/Hunyuan3D-2mini')
    parser.add_argument("--subfolder", type=str, default='hunyuan3d-dit-v2-mini-turbo')
    parser.add_argument("--tex_model_path", type=str, default='tencent/Hunyuan3D-2')"""

# ── Patch 4: forward subfolder to ModelWorker ─────────────────────────────────
INIT_OLD = """    worker = ModelWorker(model_path=args.model_path, device=args.device, enable_tex=args.enable_tex,
                         tex_model_path=args.tex_model_path)"""

INIT_NEW = """    worker = ModelWorker(model_path=args.model_path, device=args.device, enable_tex=args.enable_tex,
                         tex_model_path=args.tex_model_path, subfolder=args.subfolder)"""


def main() -> int:
    if not API_SERVER.exists():
        print(f"[patch] {API_SERVER} not found", file=sys.stderr)
        return 1

    src = API_SERVER.read_text()
    if "_mv_extra" in src:
        print("[patch] api_server.py already patched, skipping")
        return 0

    patches = [
        ("multi-view parse",      GEN_OLD,  GEN_NEW),
        ("image dict build",      IMG_OLD,  IMG_NEW),
        ("--subfolder arg",       ARG_OLD,  ARG_NEW),
        ("ModelWorker.subfolder", INIT_OLD, INIT_NEW),
    ]

    for label, old, new in patches:
        if old not in src:
            print(f"[patch] anchor for '{label}' not found — refusing to patch", file=sys.stderr)
            return 2
        src = src.replace(old, new)

    API_SERVER.write_text(src)
    print("[patch] api_server.py patched: multi-view dict + --subfolder")
    return 0


if __name__ == "__main__":
    sys.exit(main())
