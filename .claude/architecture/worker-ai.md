# Worker AI (Python)

Service Python qui consomme la queue Redis, lance la pipeline 3D via `hunyuan3d`, post-process et upload.

## Structure
```
worker-ai/
├── main.py                    # Entry point (boucle queue Redis)
├── requirements.txt
├── core/
│   ├── processor.py           # Orchestration de la pipeline
│   ├── hunyuan.py             # Client HTTP vers service hunyuan3d
│   ├── mesh_processing.py     # Cleanup, decimation, optimisation
│   └── exporters.py           # GLB / USDZ
└── utils/
    ├── config.py
    ├── logger.py
    ├── file_ops.py
    └── supabase_client.py
```

## Flow type
1. API frontend `POST /api/models` → push job Redis + insert row Supabase.
2. `worker-ai/main.py` pop le job de la queue.
3. `core/processor.py` télécharge l'image, appelle `hunyuan3d` (HTTP), récupère le mesh.
4. `core/mesh_processing.py` nettoie/optimise.
5. `core/exporters.py` génère **GLB** (Android Scene Viewer) et **USDZ** (iOS Quick Look).
6. Upload vers Supabase Storage (buckets `models-glb`, `models-usdz`).
7. Webhook → `frontend/app/api/webhooks/worker/` met à jour le statut + envoie l'event Realtime.

## Variables d'environnement clés
- `REDIS_URL=redis://redis:6379`
- `HUNYUAN3D_API_URL=http://hunyuan3d:8080`
- `HUNYUAN3D_ENABLED=true`
- `ENABLE_DRACO=true` (compression mesh)
- `NEXT_PUBLIC_APP_URL` (callback webhook)

## Hunyuan3D
- Service GPU séparé. Le worker NE charge PAS le modèle lui-même.
- Voir [services.md](services.md) pour les contraintes (start_period 3 min).
