# Règles Docker (CRITIQUE)

## ❌ NE JAMAIS rebuild `cloudflared`
- Son tunnel utilise `--url http://frontend:3000` (Quick Tunnel trycloudflare.com).
- Chaque rebuild **change l'URL publique** → casse `NEXT_PUBLIC_APP_URL` dans `.env`, casse les liens AR partagés, les QR codes existants, et les webhooks worker.
- Si on doit absolument toucher à `cloudflared`, **prévenir le user d'abord** et mettre à jour `.env` + reconstruire le frontend ensuite.

## ❌ NE JAMAIS rebuild `hunyuan3d` sans raison
- Image GPU lourde (CUDA + Hunyuan3D weights), build = très long.
- `start_period: 180s` au healthcheck — un restart prend 3+ min avant d'être healthy.
- Ne rebuild que si on a modifié `docker/hunyuan3d.Dockerfile` ou les fichiers qu'il copie.

## ✅ TOUJOURS rebuild uniquement le service modifié
Utiliser `--no-deps` pour ne pas toucher aux autres services :
```bash
docker compose up -d --build --no-deps <service>
```

| Modification touche | Rebuild |
|---|---|
| `frontend/**` | `frontend` |
| `worker-ai/**` ou `docker/worker-ai.Dockerfile` | `worker-ai` |
| `docker/hunyuan3d.Dockerfile` | `hunyuan3d` (rare) |
| `database/**` (SQL) | RIEN — exécuter via Supabase SQL editor |
| `.env` | redémarrer les services qui le consomment (`docker compose up -d --no-deps frontend worker-ai`) |

## ✅ Vérifier après un rebuild
```bash
docker compose ps <service>
docker compose logs --tail=20 <service>
```

## Ports exposés (host → container)
- `frontend` : **3050** → 3000
- `redis` : 6379 → 6379
- `hunyuan3d` : non exposé (interne uniquement, port 8080)
- `worker-ai` : non exposé
- `cloudflared` : non exposé (tunnel sortant)

## Astuce — cache Docker
- BuildKit cache les layers ; ne PAS utiliser `--no-cache` sauf si on suspecte une corruption.
- `npm ci` / `pip install` sont les couches les plus chères — éviter de modifier `package.json` / `requirements.txt` si pas nécessaire.
