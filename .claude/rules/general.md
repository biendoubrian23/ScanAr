# Règles générales

## Langue
- Le projet est **francophone**. UI copy, commentaires user-facing, messages d'erreur : en français.
- Code (variables, fonctions, types) : anglais comme c'est déjà le cas.

## Code style
- Pas de commentaires non-essentiels. Le code doit s'auto-documenter.
- Pas de refacto opportuniste — toucher uniquement ce que la tâche demande.
- Pas de "validation defensive" ni de fallback pour des cas qui ne peuvent pas arriver (ex : valeurs garanties par le typage).
- Préférer éditer un fichier existant à en créer un nouveau.

## Vérification avant de dire "terminé"
- Frontend modifié → `cd frontend && npx tsc --noEmit` (silencieux = OK).
- Service rebuild → `docker compose ps <service>` + `docker compose logs --tail=20 <service>`.

## Git
- Branch principale : `main` (push direct courant dans ce projet).
- **Ne JAMAIS commit/push sans demande explicite** du user.
- Quand on commit : message court, en anglais (suit l'historique), pas de mention "Generated with Claude" sauf demande.

## Secrets
- `.env` à la racine — contient des clés Supabase, R2, Redis. Ne JAMAIS afficher son contenu en clair dans une réponse.
- Ne jamais commit `.env` (déjà gitignored).

## URL publique
- `NEXT_PUBLIC_APP_URL` dans `.env` = URL Cloudflare tunnel.
- Cette URL est utilisée par les QR codes générés. Si elle change, les anciens QR cassent.
- Voir [docker.md](docker.md) pour pourquoi on ne rebuild pas le tunnel.
