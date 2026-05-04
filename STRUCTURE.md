# 📊 STRUCTURE PROJET - Vue Complète

## 🎯 Résumé

Arborescence complète du projet ScanAR basée sur le cahier des charges.

---

## 📁 Arborescence

```
ScanAr/
│
├── .gitignore                          ← Ignore node_modules, .env, builds
├── README.md                           ← Vue d'ensemble projet
├── STRUCTURE.md                        ← Ce fichier
│
├── 📂 frontend/                        ← UI Next.js
│   ├── README.md                       → Dashboard, landing, AR viewer
│   ├── app/                            → Next.js App Router
│   │   ├── README.md                   → Routes structure
│   │   ├── (auth)/                     → Authentification
│   │   ├── (dashboard)/                → Dashboard utilisateur
│   │   ├── (landing)/                  → Landing page publique
│   │   ├── layout.tsx                  → Layout principal
│   │   └── page.tsx                    → Accueil
│   ├── components/                     → Composants React réutilisables
│   │   ├── README.md
│   │   ├── ui/                         → Génériques (Button, Input, etc)
│   │   ├── layout/                     → Header, Navbar, Sidebar
│   │   ├── viewers/                    → 3D Viewer, AR Viewer
│   │   └── forms/                      → Upload, Settings forms
│   ├── lib/                            → Utilitaires
│   │   ├── README.md
│   │   ├── supabase.ts                 → Client Supabase
│   │   ├── api-client.ts               → HTTP client
│   │   └── auth.ts                     → Auth helpers
│   ├── hooks/                          → React hooks custom
│   │   ├── README.md
│   │   ├── useAuth.ts
│   │   ├── useUpload.ts
│   │   └── useARViewer.ts
│   └── public/                         → Images, icônes, assets
│       └── README.md
│
├── 📂 backend/                         ← API Gateway + Orchestration
│   ├── README.md                       → Responsabilités API routes
│   ├── api/                            → Endpoints API
│   │   ├── README.md
│   │   ├── auth/                       → Login, signup, logout
│   │   ├── models/                     → Upload, liste modèles 3D
│   │   ├── ar-links/                   → Liens AR, QR codes
│   │   └── webhooks/                   → Notifications worker
│   ├── middleware/                     → Auth, errors, logging
│   │   ├── README.md
│   │   ├── auth.ts
│   │   └── errors.ts
│   └── utils/                          → Services, clients
│       ├── README.md
│       ├── supabase.ts
│       ├── redis.ts
│       └── fastapi.ts
│
├── 📂 worker-ai/                       ← GPU Worker (Hunyuan3D)
│   ├── README.md                       → Pipeline 3D, FastAPI service
│   ├── main.py                         → FastAPI entry point
│   ├── queue_worker.py                 → Redis queue consumer
│   ├── core/                           → Logique processing
│   │   ├── README.md
│   │   ├── hunyuan_processor.py        → Orchestration principale
│   │   ├── models_3d.py                → Génération mesh + textures
│   │   ├── post_processor.py           → Cleanup, optimisation, compression
│   │   └── exporters.py                → Export GLB, USDZ
│   └── utils/                          → Helpers
│       ├── README.md
│       ├── config.py                   → Configuration GPU, modèles
│       ├── logger.py
│       ├── file_ops.py
│       └── supabase_client.py
│
├── 📂 database/                        ← Scripts SQL Supabase
│   ├── README.md                       → Organisation migrations/policies
│   ├── migrations/                     → Création tables (une fois)
│   │   ├── README.md
│   │   ├── 001_tables_users.sql
│   │   ├── 002_tables_models.sql
│   │   ├── 003_tables_ar_links.sql
│   │   └── 004_tables_analytics.sql
│   ├── policies/                       → Row-Level Security (RLS)
│   │   ├── README.md
│   │   ├── users_policies.sql
│   │   ├── models_policies.sql
│   │   └── ar_links_policies.sql
│   └── storage/                        → Buckets Supabase Storage
│       ├── README.md
│       ├── buckets_setup.sql           → Créer images, models-glb, models-usdz
│       └── storage_policies.sql        → RLS storage
│
├── 📂 docker/                          ← Docker Compose
│   ├── README.md                       → Configuration services
│   ├── docker-compose.yml              → Orchestration (frontend, backend, worker, redis)
│   ├── frontend.Dockerfile             → Next.js image
│   ├── worker-ai.Dockerfile            → GPU worker Python + CUDA
│   └── .dockerignore
│
├── 📂 scripts/                         ← Utilitaires
│   ├── README.md                       → Scripts dev, deploy, maintenance
│   ├── setup.sh                        → Setup initial
│   ├── dev.sh                          → Lancer services dev
│   ├── deploy.sh                       → Déploiement prod
│   ├── test.sh                         → Exécuter tests
│   └── ... (autres scripts)
│
└── 📂 docs/                            ← Documentation complète
    ├── README.md                       → Index documentation
    ├── ARCHITECTURE.md                 → Vue système
    ├── API.md                          → Endpoints documentation
    ├── FRONTEND.md                     → Guide frontend dev
    ├── BACKEND.md                      → Guide backend dev
    ├── AI_PIPELINE.md                  → Hunyuan3D pipeline
    ├── DATABASE.md                     → Schéma données
    ├── DEPLOYMENT.md                   → Production setup
    └── SETUP.md                        → Local dev setup
```

---

## 🗂 Structure par Type de Fichier

### 🏗 Architecture
- Frontend, Backend, Worker-AI, Database, Docker, Scripts, Docs

### 📄 Configuration
- `.gitignore` - Ignore dependencies, builds, env vars
- `docker-compose.yml` - Services orchestration
- `package.json` / `pyproject.toml` - Dependencies

### 🔌 APIs
- `backend/api/` - Endpoints REST
- `backend/middleware/` - Auth, errors, logging

### 🤖 IA/GPU
- `worker-ai/core/` - Pipeline Hunyuan3D
- `worker-ai/utils/` - Support processing

### 💾 Database
- `database/migrations/` - Tables creation
- `database/policies/` - RLS policies
- `database/storage/` - Storage buckets

### 📚 Documentation
- `docs/` - Guides complets
- Chaque dossier a son `README.md`

---

## ✅ Checklist Implémentation

### Phase 1: Setup
- [ ] Initialiser git & remotes
- [ ] Setup Docker Compose
- [ ] Setup Supabase project
- [ ] Configure environment variables

### Phase 2: Database
- [ ] Exécuter migrations (users, models, ar_links, analytics)
- [ ] Setup RLS policies
- [ ] Setup Storage buckets

### Phase 3: Backend
- [ ] Créer API routes (auth, models, ar-links)
- [ ] Setup middleware (auth, errors)
- [ ] Redis integration

### Phase 4: Frontend
- [ ] Setup Next.js App Router
- [ ] Create components (forms, viewers)
- [ ] Setup authentication flow
- [ ] Dashboard layout

### Phase 5: Worker-AI
- [ ] Setup FastAPI service
- [ ] Integrate Hunyuan3D
- [ ] Post-processing pipeline
- [ ] Export GLB/USDZ

### Phase 6: Integration
- [ ] Frontend → Backend API
- [ ] Backend → Worker-AI queue
- [ ] WebSocket progress updates
- [ ] End-to-end testing

---

## 🚀 Commandes Importantes

```bash
# Setup initial
docker-compose up -d
npm install && pip install -r requirements.txt

# Dev
docker-compose logs -f backend

# Database migrations
# (Exécuter depuis Supabase SQL editor)

# Tests
npm test
pytest tests/
```

---

## 💡 Points Clés

✅ **Structure modulaire** - Séparation claire frontend/backend/worker
✅ **Scalabilité** - Worker-AI peut être remplacé par RunPod/Modal
✅ **Sécurité** - RLS policies, auth middleware
✅ **Documentation** - READMEs dans chaque dossier
✅ **Propreté** - .gitignore robuste, pas de secrets en repo
✅ **Flexibilité** - Facile d'ajouter features (migrations/policies/routes)

---

## 📞 Support

Consulter `docs/SETUP.md` pour troubleshooting.
