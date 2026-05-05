# Architecture services

5 services orchestrés par `docker-compose.yml` à la racine.

```
┌─────────────┐      ┌──────────┐      ┌──────────────┐
│  cloudflared│ ───▶ │ frontend │ ───▶ │  hunyuan3d   │
│  (tunnel)   │      │ Next.js  │      │  GPU FastAPI │
└─────────────┘      │  :3050   │      │   :8080 int  │
                     └────┬─────┘      └──────┬───────┘
                          │                   ▲
                          ▼                   │
                     ┌─────────┐         ┌────┴─────┐
                     │  redis  │ ◀────── │ worker-ai│
                     │  :6379  │  queue  │  Python  │
                     └─────────┘         └──────────┘
```

## frontend (Next.js 14, App Router)
- Conteneur : `scanar-frontend-1` — port host **3050** → container 3000.
- Contient l'UI **et** les API routes (`frontend/app/api/`). Pas de service backend séparé malgré ce que dit `STRUCTURE.md`.
- Ne dépend que de `redis`.

## worker-ai (Python, CPU)
- Conteneur : `scanar-worker-ai-1`.
- Consomme la queue Redis, appelle `hunyuan3d` HTTP, push résultats vers Supabase Storage.
- Code : `worker-ai/main.py`, pipeline dans `worker-ai/core/`.

## hunyuan3d (Python, GPU NVIDIA)
- Conteneur : `scanar-hunyuan3d-1`.
- FastAPI interne sur `:8080`. Modèle Hunyuan3D pour mesh + texture.
- Healthcheck `start_period: 180s` (3 min). **Ne pas restart à la légère.**

## redis
- Cache + queue. Port 6379 exposé pour debug local.
- `maxmemory 512mb`, policy `allkeys-lru`.

## cloudflared
- Quick Tunnel trycloudflare.com (no account). Expose `frontend:3000` publiquement.
- **Rebuild = nouvelle URL = casse tout.** Voir [rules/docker.md](../rules/docker.md).

## Réseau
- Tous les services partagent le réseau Docker compose par défaut.
- Communication interne via nom de service (ex : `http://hunyuan3d:8080`, `redis://redis:6379`).
