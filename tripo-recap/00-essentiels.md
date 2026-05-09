# Essentiels Tripo3D API

## Base URL

```
https://api.tripo3d.ai/v2/openapi
```

Tous les endpoints sont sous ce préfixe.

## Authentification

Header HTTP unique sur **toutes** les requêtes :

```
Authorization: Bearer tsk_xxxxxxxx
```

- La clé est créée sur https://platform.tripo3d.ai (page API Keys).
- Elle commence par `tsk_` et n'est **affichée qu'une seule fois** à la création — à stocker dans un password manager + dans `.env` côté serveur.
- **Jamais côté client** (frontend public).

## Format de réponse universel

Succès :
```json
{ "code": 0, "data": { ... } }
```

Erreur :
```json
{ "code": 2002, "message": "...", "suggestion": "..." }
```

`code: 0` = OK. Tout autre `code` = erreur (la liste est dans [05-erreurs-cles.md](./05-erreurs-cles.md)).

## Header de traçage

Toutes les réponses incluent `X-Tripo-Trace-ID: <uuid>`. À logger systématiquement côté worker — c'est ce que le support Tripo te demandera en cas de bug.

## Pattern asynchrone (CRITIQUE)

Tripo est **100% asynchrone**. Tu ne reçois pas le GLB en réponse directe — tu reçois un `task_id` à poller.

```
1. POST /upload/sts          → image_token (ou bypass via /upload/sts/token + S3 direct)
2. POST /task                → task_id  (type: image_to_model, ...)
3. GET  /task/{task_id}      → status: queued | running | success | failed | ...
4. Quand status = success    → output.pbr_model = URL signée du GLB (TTL 5 min !)
5. Download immédiat         → push vers ton storage (R2 / Supabase) avant l'expiration
```

## États possibles d'une tâche

**Ongoing** (continuer à poller) :
- `queued` — en file d'attente, progress = 0
- `running` — en cours, progress = 0..100

**Finalized** (arrêter le polling) :
- `success` — `output` contient les URLs téléchargeables
- `failed` — souvent côté Tripo, créer un ticket avec `task_id`
- `banned` — violation content policy
- `expired` — TTL dépassé sur la tâche elle-même
- `cancelled` — annulée
- `unknown` — bug système, contacter support

## TTL des URLs de sortie

**5 minutes** pour les URLs `output.model`, `output.pbr_model`, `output.rendered_image`, etc.
→ Le worker doit télécharger immédiatement après détection du `success` et re-uploader sur ton storage permanent.

## Important : isolation par clé API

Une tâche créée avec la clé A ne peut **pas** être interrogée avec la clé B, même si les deux clés appartiennent au même compte. Une seule clé en prod, une autre en dev.

## SDK Python officiel

```
pip install tripo3d
```

API style asyncio (`async with TripoClient(...)`, `await client.image_to_model(...)`, `wait_for_task`).
Disponible si on veut éviter de gérer le polling à la main, mais notre worker actuel a déjà sa logique async — pas critique d'ajouter une dépendance.
