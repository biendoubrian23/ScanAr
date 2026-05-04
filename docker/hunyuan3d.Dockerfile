FROM pytorch/pytorch:2.6.0-cuda12.6-cudnn9-devel

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/root/.cache/huggingface
ENV TORCH_CUDA_ARCH_LIST="8.9"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    wget \
    ninja-build \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libopengl0 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Clone Hunyuan3D-2 official repo
RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.git /app/Hunyuan3D-2

WORKDIR /app/Hunyuan3D-2

# Install base Python dependencies + the hy3dgen package
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -e .

# Patch: add /health endpoint and trust_remote_code for custom diffusers pipeline
RUN sed -i 's/@app.post("\/generate")/@app.get("\/health")\ndef health_check():\n    return {"status": "ok"}\n\n@app.post("\/generate")/' \
    api_server.py

# Patch: trust_remote_code required for custom diffusers pipeline
RUN sed -i 's/custom_pipeline=custom_pipeline_path, torch_dtype=torch.float16/custom_pipeline=custom_pipeline_path, torch_dtype=torch.float16, trust_remote_code=True/' \
    hy3dgen/texgen/utils/multiview_utils.py

# Build CUDA texture extensions (custom_rasterizer)
RUN cd hy3dgen/texgen/custom_rasterizer && \
    python setup.py install && \
    cd /app/Hunyuan3D-2

# Build CUDA texture extensions (differentiable_renderer)
RUN cd hy3dgen/texgen/differentiable_renderer && \
    python setup.py install && \
    cd /app/Hunyuan3D-2

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=15s --start-period=300s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

# Launch the official API server with:
#   - Hunyuan3D-2mini for shape generation (lighter, fits 16GB)
#   - Hunyuan3D-2 for texture painting
#   - low_vram_mode for sequential model loading
CMD ["python", "api_server.py", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--enable_tex", \
     "--device", "cuda"]
