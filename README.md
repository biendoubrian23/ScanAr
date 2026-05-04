# 🚀 ScanAR - Turn Any Image Into AR Reality

Plateforme SaaS permettant de transformer une image en modèle 3D via IA, puis visualiser et partager cette expérience en réalité augmentée.

## 🏗 Architecture Globale

```
ScanAR/
├── frontend/          → UI Next.js (dashboard, landing)
├── backend/           → FastAPI (API gateway, processus)
├── worker-ai/         → GPU Worker (Hunyuan3D)
├── database/          → Scripts SQL Supabase
├── docker/            → Docker Compose configuration
├── scripts/           → Utilitaires et outils
└── docs/              → Documentation projet
```

## 🔑 Stack Technologique

- **Frontend**: Next.js 14+ (App Router), Three.js, model-viewer
- **Backend**: FastAPI, Next.js API routes
- **IA/GPU**: Python, Hunyuan3D, Docker
- **Queue**: Redis
- **DB/Auth**: Supabase
- **Communication**: WebSocket (progress temps réel)

## ⚡ Démarrage Rapide

```bash
# Installation dépendances
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Lancer les services
docker-compose up
```

## 📚 Documentation

Consulter les READMEs dans chaque dossier pour les détails spécifiques.

## 🚀 Phase MVP

- Cloudflare Tunnel
- Docker Compose local
- GPU local