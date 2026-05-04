# ✅ IMPLEMENTATION CHECKLIST - ScanAR

## 📋 À faire étape par étape

### 🏁 Phase 0: Setup Initial (À faire MAINTENANT)

- [ ] **Git Repository**
  - [ ] `git init` ou lier à repo GitHub
  - [ ] Vérifier `.gitignore` ignore bien node_modules, .env, builds
  - [ ] Premier commit: structure projet

- [ ] **Environment Variables**
  - [ ] Copier `.env` depuis template
  - [ ] Remplir credentials Supabase
  - [ ] Remplir URLs services (Redis, FastAPI)

---

### 🗄️ Phase 1: Database - Supabase

**À faire dans Supabase Dashboard → SQL Editor**

- [ ] **Migrations Tables**
  - [ ] Exécuter `database/migrations/001_tables_users.sql`
  - [ ] Exécuter `database/migrations/002_tables_models.sql`
  - [ ] Exécuter `database/migrations/003_tables_ar_links.sql`
  - [ ] Exécuter `database/migrations/004_tables_analytics.sql`

- [ ] **RLS Policies**
  - [ ] Exécuter `database/policies/users_policies.sql`
  - [ ] Exécuter `database/policies/models_policies.sql`
  - [ ] Exécuter `database/policies/ar_links_policies.sql`

- [ ] **Storage Buckets**
  - [ ] Exécuter `database/storage/buckets_setup.sql`
  - [ ] Exécuter `database/storage/storage_policies.sql`
  - [ ] Ou créer manuellement 3 buckets: `images`, `models-glb`, `models-usdz`

---

### ⚙️ Phase 2: Backend API Setup

**À faire dans `backend/` folder**

- [ ] **Init Next.js Project**
  - [ ] `npx create-next-app@latest . --typescript --tailwind`
  - [ ] Installer: `npm install @supabase/supabase-js redis axios`
  - [ ] Créer `lib/supabase.ts` - Client Supabase
  - [ ] Créer `lib/api-client.ts` - HTTP wrapper

- [ ] **Middleware**
  - [ ] `middleware/auth.ts` - Vérifier JWT Supabase
  - [ ] `middleware/errors.ts` - Error handling centralisé
  - [ ] Appliquer dans `api/` routes

- [ ] **API Routes**
  - [ ] `api/auth/login.ts` - POST login
  - [ ] `api/auth/signup.ts` - POST signup
  - [ ] `api/models/upload.ts` - POST upload image (vers Redis queue)
  - [ ] `api/models/list.ts` - GET modèles utilisateur
  - [ ] `api/ar-links/create.ts` - POST créer lien AR
  - [ ] `api/webhooks/worker-complete.ts` - POST webhook worker

- [ ] **Utils**
  - [ ] `utils/redis.ts` - Client Redis + queue functions
  - [ ] `utils/fastapi.ts` - Appels service FastAPI
  - [ ] `utils/validators.ts` - Validation données

---

### 🎨 Phase 3: Frontend Setup

**À faire dans `frontend/` folder**

- [ ] **Init Next.js Project**
  - [ ] `npx create-next-app@latest . --typescript --tailwind --app`
  - [ ] Installer: `npm install @supabase/supabase-js three @react-three/fiber @google/model-viewer`

- [ ] **Components**
  - [ ] `components/ui/Button.tsx` - Bouton générique
  - [ ] `components/ui/Input.tsx` - Input générique
  - [ ] `components/forms/LoginForm.tsx`
  - [ ] `components/forms/SignupForm.tsx`
  - [ ] `components/forms/UploadForm.tsx` - Upload image
  - [ ] `components/viewers/ModelViewer3D.tsx` - Three.js viewer
  - [ ] `components/viewers/ARViewer.tsx` - model-viewer

- [ ] **Pages**
  - [ ] `app/(landing)/page.tsx` - Landing page
  - [ ] `app/(auth)/login/page.tsx` - Login page
  - [ ] `app/(auth)/signup/page.tsx` - Signup page
  - [ ] `app/(dashboard)/layout.tsx` - Dashboard layout
  - [ ] `app/(dashboard)/models/page.tsx` - Mes modèles
  - [ ] `app/(dashboard)/ar-links/page.tsx` - Mes liens AR

- [ ] **Hooks**
  - [ ] `hooks/useAuth.ts` - Auth state + functions
  - [ ] `hooks/useUpload.ts` - Upload state + progress
  - [ ] `hooks/useFetch.ts` - Fetch data wrapper

- [ ] **Lib**
  - [ ] `lib/supabase.ts` - Supabase client
  - [ ] `lib/api-client.ts` - API fetch functions
  - [ ] `lib/auth.ts` - Auth helpers

---

### 🤖 Phase 4: Worker-AI (GPU Processing)

**À faire dans `worker-ai/` folder**

- [ ] **Init Python Project**
  - [ ] Créer `requirements.txt` avec:
    - fastapi, uvicorn
    - torch, torchvision
    - hunyuan3d (ou équivalent)
    - redis, python-dotenv
    - supabase-py
  - [ ] `pip install -r requirements.txt`

- [ ] **FastAPI Service**
  - [ ] `main.py` - FastAPI app + routes
    - [ ] GET `/health` - Health check
    - [ ] POST `/process-3d` - Launch Hunyuan3D job
    - [ ] GET `/job/{job_id}/status` - Check status
  
- [ ] **Processing Pipeline**
  - [ ] `core/hunyuan_processor.py` - Main orchestration
  - [ ] `core/models_3d.py` - Hunyuan3D mesh generation
  - [ ] `core/post_processor.py` - Cleanup, compression
  - [ ] `core/exporters.py` - Export GLB/USDZ

- [ ] **Queue Worker**
  - [ ] `queue_worker.py` - Redis consumer
    - [ ] Écoute Redis queue
    - [ ] Exécute processing
    - [ ] Upload résultat Supabase
    - [ ] Appelle webhook backend

- [ ] **Utils**
  - [ ] `utils/config.py` - Configuration (GPU device, timeouts)
  - [ ] `utils/supabase_client.py` - Supabase storage ops
  - [ ] `utils/logger.py` - Logging setup

---

### 🐳 Phase 5: Docker & Orchestration

**À faire à la racine du projet**

- [ ] **Docker Compose**
  - [ ] Créer `docker-compose.yml` avec services:
    - frontend (port 3000)
    - backend (port 3001)
    - worker-ai (port 8000, GPU enabled)
    - redis (port 6379)
  - [ ] Créer `.env` pour docker-compose

- [ ] **Dockerfiles**
  - [ ] `docker/frontend.Dockerfile` - Next.js build
  - [ ] `docker/worker-ai.Dockerfile` - GPU + Python

- [ ] **Test Local**
  - [ ] `docker-compose up -d`
  - [ ] Vérifier santé services: localhost:3000, 3001, 8000

---

### 🔗 Phase 6: Integration End-to-End

- [ ] **Frontend → Backend**
  - [ ] Test login/signup
  - [ ] Test upload image
  - [ ] Vérifier appel API backend

- [ ] **Backend → Worker-AI**
  - [ ] Test mise en queue job
  - [ ] Vérifier reçu par worker
  - [ ] Test appel FastAPI

- [ ] **Worker-AI → Supabase**
  - [ ] Test upload modèle GLB/USDZ
  - [ ] Test webhook notification

- [ ] **Full Pipeline**
  - [ ] Upload image dans UI
  - [ ] Voir modèle 3D après traitement
  - [ ] Générer QR code
  - [ ] Accéder lien AR public

---

### 📚 Phase 7: Documentation

- [ ] Remplir `docs/SETUP.md` - Setup local
- [ ] Remplir `docs/ARCHITECTURE.md` - Vue système
- [ ] Remplir `docs/API.md` - Endpoints documentation
- [ ] Remplir `docs/DATABASE.md` - Schéma données
- [ ] Remplir `docs/DEPLOYMENT.md` - Production setup

---

## 📝 Notes Importantes

✅ **Structure** - Respecter l'arborescence proposée
✅ **.env** - JAMAIS commiter, ajouter à `.gitignore`
✅ **TypeScript** - Frontend + Backend (type safety)
✅ **RLS** - Implémenter correctement les policies Supabase
✅ **Error Handling** - Middleware centralisé backend
✅ **Logging** - Configurer partout (frontend, backend, worker)
✅ **Tests** - Ajouter tests unitaires progressivement
✅ **Git** - Commits réguliers, messages clairs

---

## 🚀 Commandes Rapides

```bash
# Docker dev
docker-compose up -d
docker-compose logs -f

# Install dépendances
cd frontend && npm install
cd ../backend && npm install
cd ../worker-ai && pip install -r requirements.txt

# Run tests
npm test
pytest

# Format code
npx prettier --write .
black .
```

---

## 🆘 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | `docker-compose down` puis retry |
| GPU pas détecté | Vérifier NVIDIA Docker runtime |
| Erreur Supabase connection | Vérifier `.env` credentials |
| Files upload échouent | Vérifier RLS policies storage |
| Queue jobs ne traitent pas | Vérifier Redis connection |

---

**Dernière mise à jour**: 4 mai 2026
