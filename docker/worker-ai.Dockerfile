FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    xz-utils \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxi6 \
    libxkbcommon0 \
    libxfixes3 \
    && rm -rf /var/lib/apt/lists/*

# Install Blender (headless) for GLB → USDZ conversion
RUN wget -q --no-check-certificate "https://download.blender.org/release/Blender4.2/blender-4.2.0-linux-x64.tar.xz" \
    && tar -xJf blender-4.2.0-linux-x64.tar.xz -C /opt/ \
    && rm blender-4.2.0-linux-x64.tar.xz \
    && echo "/opt/blender-4.2.0-linux-x64/lib" > /etc/ld.so.conf.d/blender.conf \
    && ldconfig \
    && printf '#!/bin/sh\nexec /opt/blender-4.2.0-linux-x64/blender "$@"\n' > /usr/local/bin/blender \
    && chmod +x /usr/local/bin/blender

# Install gltfpack for Draco compression
RUN wget -q https://github.com/zeux/meshoptimizer/releases/download/v0.21/gltfpack-0.21-linux.tar.gz && \
    tar -xzf gltfpack-0.21-linux.tar.gz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/gltfpack && \
    rm gltfpack-0.21-linux.tar.gz || true

COPY worker-ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker-ai/ .

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD python -c "import redis, os; r = redis.from_url(os.getenv('REDIS_URL','redis://redis:6379')); r.ping()" || exit 1

CMD ["python", "main.py"]
