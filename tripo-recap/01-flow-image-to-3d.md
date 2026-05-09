# Workflow image-to-3D pour ScanAr

Le flux exact que `worker-ai/` va exécuter à la place de Hunyuan3D.

## Vue d'ensemble

```
[Photo(s) ScanAr]
    │
    ▼
1. Upload vers Tripo S3  →  file_token (ou object{bucket,key} via STS)
    │
    ▼
2. POST /task            →  task_id  (type: image_to_model | multiview_to_model)
    │
    ▼
3. Poll GET /task/{id}   →  status = success
    │
    ▼
4. Download output.pbr_model (URL signée, TTL 5 min)
    │
    ▼
5. Re-upload vers R2 / Supabase Storage (storage permanent)
    │
    ▼
6. Continuer le pipeline ScanAr (cleanup → scaling → Draco → publish)
```

## Étape 1 — Upload de l'image

Deux options. **L'option simple suffit** pour commencer.

### Option simple (multipart direct)

```
POST /v2/openapi/upload/sts
Content-Type: multipart/form-data
file: <binary>
```

Réponse : `{ image_token: "<uuid>" }`. Cet `image_token` se passe ensuite à la création de tâche via `file.file_token`.

**Limites** :
- Formats : `webp`, `jpeg`, `png`
- Taille max : **10 MB**
- Résolution recommandée : > 256 px
- Rate limit upload : **10 QPS**

### Option STS (S3 direct)

Pour upload massif — Tripo te donne des credentials S3 temporaires (`POST /upload/sts/token` retourne `s3_host`, `resource_bucket`, `resource_uri`, `session_token`, `sts_ak`, `sts_sk`). Tu uploades toi-même sur leur bucket S3, puis tu passes `file.object: { bucket, key }` à la création de tâche.

→ Strongly Recommended par Tripo, mais l'option simple suffit pour notre volume actuel. À envisager si on dépasse les 10 QPS.

## Étape 2 — Création de la tâche

### Cas A : 1 photo (image_to_model)

```
POST /v2/openapi/task
{
  "type": "image_to_model",
  "model_version": "P1-20260311",
  "file": { "type": "jpg", "file_token": "<token>" },
  "texture": true,
  "pbr": true,
  "texture_quality": "detailed",
  "auto_size": true,
  "orientation": "align_image",
  "face_limit": 8000
}
```

→ Réponse : `{ task_id: "..." }`.

### Cas B : 2-4 photos (multiview_to_model)

ScanAr supporte déjà 1-4 images uploadées par l'utilisateur. **Si l'utilisateur uploade 2+ images, on utilise multiview pour une meilleure qualité au même prix.**

```
POST /v2/openapi/task
{
  "type": "multiview_to_model",
  "model_version": "P1-20260311",
  "files": [
    { "type": "jpg", "file_token": "<front>" },
    { "type": "jpg", "file_token": "<left>" },
    { "type": "jpg", "file_token": "<back>" },
    { "type": "jpg", "file_token": "<right>" }
  ],
  "texture": true, "pbr": true,
  "texture_quality": "detailed",
  "auto_size": true,
  "face_limit": 8000
}
```

**Règle stricte multiview** : la liste contient **exactement 4 items** dans l'ordre `[front, left, back, right]`. Tu peux omettre des slots avec `{}` (objet vide) — la **front view est obligatoire** et il faut **au moins 2 images** valides au total.

```json
"files": [
  { "type": "jpg", "file_token": "<front>" },
  {},
  { "type": "jpg", "file_token": "<back>" },
  {}
]
```

## Étape 3 — Polling

```
GET /v2/openapi/task/{task_id}
```

Stratégie de polling recommandée :
- Intervalle : **3-5 secondes** (les générations P1 prennent ~30-90s en pratique)
- Timeout total : **5 minutes** (au-delà = anomalie, log + retry plus tard)
- Backoff exponentiel sur erreur 5xx, immédiat sur 200

Champs utiles dans la réponse :
- `status` — pour décider de continuer ou s'arrêter
- `progress` — 0..100, à propager via Realtime au frontend
- `output.pbr_model` — URL GLB avec PBR (notre cible)
- `output.model` — URL GLB sans PBR (fallback si `pbr=false`)
- `output.rendered_image` — preview rendue par Tripo (utile pour fallback poster)
- `consumed_credit` — crédits réellement consommés (logguer pour le reporting)

## Étape 4 — Download avant expiration

L'URL `output.pbr_model` expire **dans 5 minutes**. Le worker doit :

1. Détecter `status === "success"`
2. Télécharger immédiatement le GLB (httpx avec timeout 60s, retry 3×)
3. Re-uploader sur Supabase Storage (`models-glb` bucket) comme aujourd'hui
4. Stocker l'URL publique permanente dans `models_3d.glb_url`
5. Continuer le pipeline existant : cleanup → scaling (avec `real_dimensions_cm` du GPT) → Draco → AR viewer

## Quoi faire si auto_size suffit pour le scaling ?

Tripo expose `auto_size: true` qui scale le modèle aux dimensions réelles **en mètres**. Si Tripo détecte correctement la taille à partir de la photo, ça pourrait remplacer notre estimation GPT.

**À tester en parallèle** :
- Pipeline A : Tripo `auto_size: true`, on lit le bbox du GLB et on s'en sert directement
- Pipeline B : notre estimation GPT-4o-mini + scaling trimesh (déjà en place)

→ Si A donne des résultats fiables, on désactive notre étape `estimating_size` quand on bascule sur Tripo. Sinon on garde GPT comme fallback / cross-check.

## Mapping à notre pipeline actuel

| Étape ScanAr actuelle (Hunyuan3D) | Équivalent Tripo |
|---|---|
| `download_image()` (depuis Supabase) | inchangé |
| `enhance_images()` (gpt-image-1) | inchangé (toujours utile pour passer une image propre à Tripo) |
| `complete_views()` (gpt-4o + gpt-image-1) | **inutile** — Tripo gère mieux les vues partielles via multiview |
| `estimate_real_size()` (gpt-4o-mini) | **optionnel** si `auto_size` Tripo fonctionne |
| `generate_3d_with_usdz()` → Hunyuan3D `:8080` | `POST /task` + polling Tripo |
| `cleanup_glb()` (trimesh outliers + Taubin) | inchangé (Tripo n'inclut pas tout) |
| `apply_real_scale()` (trimesh) | inchangé OU remplacé par `auto_size` |
| Draco compression | inchangé |
| Upload R2 / Supabase | inchangé |

→ Le diff sur le code worker-ai est **petit** : remplacer `core/hunyuan.py` par un nouveau `core/tripo.py`, garder tout le reste.
