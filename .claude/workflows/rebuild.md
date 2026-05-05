# Workflow rebuild

Toujours rebuild **uniquement le service modifié**. Voir [rules/docker.md](../rules/docker.md) pour le pourquoi.

## Commande de base
```bash
docker compose up -d --build --no-deps <service>
```

`--no-deps` = ne touche pas aux services dont dépend `<service>` (donc `cloudflared`, `hunyuan3d`, `redis` restent intacts).

## Cas par cas

### Modif frontend (UI, API routes, components, hooks, etc.)
```bash
cd c:/Users/bbiendou/Documents/Messages/ScanAr
docker compose up -d --build --no-deps frontend
docker compose logs --tail=15 frontend
```
URL de test : http://localhost:3050

### Modif worker-ai (Python pipeline)
```bash
docker compose up -d --build --no-deps worker-ai
docker compose logs --tail=20 worker-ai
```

### Modif `.env`
Le frontend a ses `NEXT_PUBLIC_*` **inlined au build** (cf `docker/frontend.Dockerfile` ARGS). Donc :
- Si on change un `NEXT_PUBLIC_*` → **rebuild frontend** (pas juste restart).
- Si on change une variable runtime (REDIS_URL, etc.) → simple restart suffit :
  ```bash
  docker compose up -d --no-deps --force-recreate <service>
  ```

### Modif SQL
**Aucun rebuild Docker.** Exécuter le SQL dans Supabase Dashboard → SQL Editor.

### Ce qu'on ne rebuild JAMAIS sans demande explicite
- `cloudflared` → casse l'URL publique (voir [rules/docker.md](../rules/docker.md)).
- `hunyuan3d` → 3+ min de start_period, image GPU lourde.

## Vérification post-rebuild
```bash
docker compose ps                       # tous "Up" / "healthy"
docker compose logs --tail=30 <service> # pas d'erreur
```

## Si quelque chose part en sucette
- Voir [debug.md](debug.md).
- Ne JAMAIS faire `docker compose down -v` (supprime les volumes Redis + cache HuggingFace = retéléchargement modèles).
