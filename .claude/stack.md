# Tech stack — résumé

## Frontend
- **Next.js 14.2.3** App Router, output standalone (Docker).
- **React 18**, **TypeScript 5**.
- **Tailwind 3.4** + classes custom (`globals.css`).
- **framer-motion 11** — animations.
- **lucide-react** — icônes.
- **@supabase/ssr** + **@supabase/supabase-js** — auth + DB.
- **ioredis** — queue depuis API routes.
- **@google/model-viewer** — viewer 3D/AR (web component).
- **react-dropzone** — upload.
- **sharp** — preprocess images.
- **qrcode** — génération QR.

## Backend = API routes Next.js
Pas de service backend séparé. Tout est dans [frontend/app/api/](../frontend/app/api/).

## Worker AI
- **Python 3** (CPU only).
- **FastAPI** côté hunyuan3d, client HTTP côté worker.
- Communique via **Redis** (queue) + **Supabase Storage** (upload résultats).

## Hunyuan3D
- **Hunyuan3D** (Tencent) — génération mesh + texture.
- **CUDA / NVIDIA GPU** requis.
- FastAPI sur :8080 (interne).
- Cache modèles HuggingFace dans volume `hf_cache`.

## Database / Storage
- **Supabase hosted** : Postgres + Auth + Storage + Realtime.
- **Cloudflare R2** : présent dans `.env` mais non utilisé pour le MVP.

## Infra dev
- **Docker Compose** — 5 services.
- **Cloudflare Quick Tunnel** — exposition publique sans compte.

## Dossiers à connaître
| Dossier | Contenu |
|---|---|
| `frontend/` | Tout le UI + API routes |
| `worker-ai/` | Pipeline Python |
| `database/migrations/` | SQL Supabase |
| `database/policies/` | RLS |
| `docker/` | Dockerfiles (frontend, worker-ai, hunyuan3d) |
| `docs/` | Documentation projet (peu rempli) |
| `scripts/` | Scripts utilitaires |
| `.claude/` | **Cette doc — pour Claude** |

## Variables d'environnement clés (`.env` racine)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` ← URL Cloudflare tunnel (fragile, voir [rules/docker.md](rules/docker.md))
- `REDIS_URL=redis://redis:6379`
- `HUNYUAN3D_API_URL=http://hunyuan3d:8080`
- `NEXT_PUBLIC_R2_PUBLIC_URL`, `CLOUDFLARE_R2_*` (non utilisé MVP)
