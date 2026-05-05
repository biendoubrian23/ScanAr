# ScanAR — Index pour Claude

Lis cet index en premier. Ne lis ensuite QUE les fichiers pertinents à la tâche en cours.
Tout ce qui est ici est conçu pour éviter de relire le code source.

## Règles dures (toujours appliquer)
- [rules/docker.md](rules/docker.md) — **build/rebuild Docker (CRITIQUE)**
- [rules/general.md](rules/general.md) — conventions générales du projet

## Architecture (pour situer le code)
- [architecture/services.md](architecture/services.md) — vue d'ensemble des 5 services + ports
- [architecture/frontend.md](architecture/frontend.md) — Next.js 14 App Router (UI + API routes)
- [architecture/worker-ai.md](architecture/worker-ai.md) — pipeline 3D Python/GPU
- [architecture/database.md](architecture/database.md) — Supabase, migrations, RLS

## Workflows (comment faire X)
- [workflows/rebuild.md](workflows/rebuild.md) — rebuild ciblé service par service
- [workflows/debug.md](workflows/debug.md) — logs, troubleshooting

## Tech stack résumée
Voir [stack.md](stack.md).
