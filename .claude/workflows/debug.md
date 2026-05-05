# Workflow debug

## Logs

```bash
docker compose logs --tail=50 <service>          # tail
docker compose logs -f <service>                 # follow (ctrl-c pour sortir)
docker compose logs --since=5m <service>         # dernières 5 min
```

Services : `frontend`, `worker-ai`, `hunyuan3d`, `redis`, `cloudflared`.

## État des services
```bash
docker compose ps
```
Statuts attendus :
- `frontend` : `Up`
- `redis` : `Up (healthy)`
- `hunyuan3d` : `Up (healthy)` — peut prendre 3 min après start
- `worker-ai` : `Up (healthy)`
- `cloudflared` : `Up`

## Frontend ne reflète pas mes changements
1. Vérifier que le rebuild a bien eu lieu : `docker compose ps frontend` → "CREATED" récent.
2. Hard refresh navigateur : Ctrl+Shift+R.
3. Vérifier les logs : `docker compose logs --tail=20 frontend` → cherche les warnings de build.

## Frontend type errors
```bash
cd frontend && npx tsc --noEmit
```

## Worker ne traite pas les jobs
1. Logs worker : `docker compose logs --tail=50 worker-ai`.
2. Vérifier la connexion Redis : `docker compose exec redis redis-cli ping` → `PONG`.
3. Vérifier que `hunyuan3d` est healthy.
4. Vérifier la queue : `docker compose exec redis redis-cli LRANGE jobs 0 -1` (nom de queue à confirmer dans `worker-ai/main.py`).

## URL Cloudflare changée par accident
1. Récupérer la nouvelle URL : `docker compose logs cloudflared | grep trycloudflare.com`.
2. Mettre à jour `NEXT_PUBLIC_APP_URL` dans `.env`.
3. Rebuild frontend (variable inlined au build).
4. ⚠️ Les anciens QR codes/liens AR sont morts.

## Conteneur unhealthy
- `hunyuan3d` : probablement encore au start_period (3 min). Patienter, surveiller `docker compose logs hunyuan3d`.
- `redis` : très rare. Vérifier le volume `redis_data` n'est pas plein.

## Ne JAMAIS faire pour debug
- `docker compose down -v` → wipe les volumes (redis + cache HF Hunyuan3D).
- `docker system prune -a` → wipe les images, retéléchargement très long.
- Rebuild `cloudflared` → URL publique change.
