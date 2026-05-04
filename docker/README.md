# 🐳 Docker - ScanAR

Configuration Docker Compose pour développement et déploiement.

## 📋 Contenu

### docker-compose.yml
Service orchestration pour développement local:

- **frontend** - Next.js UI
  - Port: 3000
  - Volume: ./frontend
  
- **backend** - Next.js API Routes
  - Port: 3001
  - Volume: ./backend
  
- **worker-ai** - GPU Worker FastAPI
  - Port: 8000
  - GPU enabled
  - Volume: ./worker-ai
  
- **redis** - Queue manager
  - Port: 6379
  - Persistence: dump.rdb
  
- **postgres** (optionnel local dev)
  - Port: 5432
  - Ou utiliser Supabase cloud

### Dockerfiles

#### frontend.Dockerfile
- Base: node:18-alpine
- Build: npm install, npm run build
- Runtime: npm start

#### worker-ai.Dockerfile
- Base: nvidia/cuda:11.8.0-runtime
- Python 3.10+
- Dependencies: Hunyuan3D, torch, etc
- GPU support

### Volumes
- Frontend: code hot-reload
- Backend: code hot-reload
- Worker: code hot-reload
- Redis: persistence

### Networks
- Tous services sur même réseau local (docker-compose)
- Frontend → Backend: http://backend:3001
- Backend → Worker: http://worker-ai:8000
- Backend → Redis: redis://redis:6379

## 🚀 Commandes

```bash
# Lancer tous les services
docker-compose up

# Lancer en background
docker-compose up -d

# Voir logs
docker-compose logs -f [service]

# Arrêter
docker-compose down

# Rebuild images
docker-compose up --build
```

## ⚙️ Configuration

### .env variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_WORKER_URL=http://worker-ai:8000
```

### GPU Setup (Linux)
```bash
# NVIDIA Docker runtime
docker run --gpus all ...
```

### DNS Résolution
- Services communiquent via hostnames (redis, worker-ai, backend)
- DNS automatique via docker compose

## 🔄 Workflow Dev

1. Clone repo
2. `docker-compose up`
3. Frontend accessible: http://localhost:3000
4. API: http://localhost:3001
5. Worker: http://localhost:8000

## 🚀 Phase Scale

- Utiliser RunPod/Modal au lieu de worker local
- CDN pour modèles 3D
- Autoscaling workers
- Cloudflare Tunnel pour prod
