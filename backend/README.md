# ⚙️ Backend - ScanAR

Couche backend: API gateway + orchestration des jobs 3D.

## 📋 Contenu

### API Routes (Next.js)
- **api/auth/** - Endpoints authentification
  - POST /login
  - POST /signup
  - POST /logout
  
- **api/models/** - Gestion modèles 3D
  - POST /upload (image → queue worker)
  - GET /models (liste utilisateur)
  - GET /models/:id (détail)
  - DELETE /models/:id
  
- **api/ar-links/** - Liens et QR codes AR
  - POST /create (générer lien AR)
  - GET /links (liste utilisateur)
  - POST /generate-qr (générer QR code)
  - GET /links/:id/stats (analytics)
  
- **api/webhooks/** - Webhooks
  - POST /worker-complete (notification fin 3D generation)
  - POST /track-scan (tracking scans)

### Services FastAPI (externe)
- **FastAPI service** - Processus lourds
  - POST /process-3d (launch Hunyuan3D job)
  - GET /job/:job_id/status
  - GET /job/:job_id/result

### Middleware & Utils
- **middleware/** - Auth, rate limiting, logging
- **utils/** - Helpers API
- **config/** - Configuration services

## 🔑 Responsabilités

1. **Routage requêtes** vers services appropriés
2. **Auth & Permissions** - Vérification tokens Supabase
3. **Orchestration** - Mise en queue jobs GPU
4. **Webhooks** - Recevoir notifications workers
5. **Cache** - Redis pour status jobs
6. **Analytics** - Tracking scans AR

## 🚀 Tech Stack
- **Next.js API Routes** (API gateway léger)
- **FastAPI** (service GPU externe)
- **Redis** (job queue)
- **Supabase** (auth, DB)
- **TypeScript/Python**

## 📦 Dependencies
- next
- redis (ou node-redis)
- @supabase/supabase-js
- axios (HTTP client)

## 🔄 Communication
- Frontend → Next.js API Routes
- Next.js → FastAPI service
- FastAPI → Redis queue
- Worker → webhooks
