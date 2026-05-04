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




proposition pour les requirements a modifier ci nessaire bien sur:

# =========================
# 🔥 CORE BACKEND
# =========================
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
python-multipart==0.0.6

# =========================
# 🧠 PYTORCH / GPU STACK
# =========================
torch>=2.2.0
torchvision>=0.17.0
torchaudio>=2.2.0

# 👉 AJOUT IMPORTANT
accelerate>=0.25.0
xformers>=0.0.23
safetensors>=0.4.0

# =========================
# 🤖 HUNYUAN / DIFFUSION AI
# =========================
transformers==4.36.0
diffusers>=0.28.0   # ⬅️ upgrade critique
einops==0.7.0
omegaconf==2.3.0
imageio==2.33.1
imageio-ffmpeg==1.4.9
huggingface_hub

# =========================
# 🧊 3D PROCESSING
# =========================
trimesh==4.0.0
pygltflib==1.16.0
pycollada==0.7.2
open3d==0.18.0
numpy==1.24.3
scipy==1.11.4

# =========================
# 🖼️ IMAGE PROCESSING
# =========================
pillow==10.0.1
opencv-python==4.8.1.78
controlnet-aux   # ⬅️ utile preprocessing image → 3D

# =========================
# ⚡ BACKEND / INFRA
# =========================
redis==5.0.1
celery==5.3.4
supabase==2.3.4
requests==2.31.0
loguru==0.7.2
tqdm==4.66.1

# =========================
# 🧪 DEV / TEST
# =========================
pytest==7.4.3
black==23.12.0
flake8==6.1.0

# =========================
# ❌ OPTIONNEL / SUPPRIMABLE
# =========================
# draco==1.5.7   ← inutile dans 90% des pipelines Python