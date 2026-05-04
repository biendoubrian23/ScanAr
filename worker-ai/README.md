# 🤖 Worker-AI - GPU Processing

Service Python dédié à la génération 3D via Hunyuan3D sur GPU.

## 📋 Contenu

### Main Pipeline
- **main.py** - Point d'entrée service FastAPI
- **hunyuan_processor.py** - Orchestration Hunyuan3D
- **models_3d.py** - Génération mesh + textures
- **post_processor.py** - Post-processing (cleanup, optimisation)
- **exporters.py** - Export GLB, USDZ

### Étapes Processing
1. **Téléchargement** image depuis Supabase Storage
2. **Hunyuan3D** génère mesh 3D + textures
3. **Post-processing**
   - Nettoyage mesh
   - Optimisation topologie
   - Compression Draco
4. **Export**
   - GLB (web + Android)
   - USDZ (Apple AR QuickLook)
5. **Upload** résultat vers Supabase Storage
6. **Notification** backend via webhook

### Queue Worker
- **queue_worker.py** - Consumer Redis
- Traite jobs depuis Redis queue
- Gère retries en cas erreur
- Logs détaillés

### Utils
- **config.py** - Configuration (GPU device, modèles, etc)
- **utils.py** - Helpers (file ops, conversions)
- **logging.py** - Setup logging

## 🔧 Configuration

### GPU
- CUDA support
- GPU selection
- Memory management

### Supabase
- Credentials (service account)
- Storage buckets

### Redis
- Connection URL
- Queue name

## 📦 Dependencies
- fastapi
- hunyuan3d
- torch
- opencv-python
- supabase-py
- redis
- pydantic

## 🚀 Deployment

- Docker container GPU
- RunPod / Modal (scale phase)
- Local dev sur GPU

## ⚙️ Performance

- Timeout job (ex: 5min max)
- Error handling robuste
- Progress tracking WebSocket

## 🔄 Communication
- Écoute Redis queue
- Upload résultats Supabase
- Webhook backend (completion)
