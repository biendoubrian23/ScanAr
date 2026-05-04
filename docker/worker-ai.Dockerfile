FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

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
