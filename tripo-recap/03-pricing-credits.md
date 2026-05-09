# Pricing & crédits — chiffres officiels

Source : `Doc Tripo/19-pricing-billing.md`. Mis à jour 17/04/2026 (dernière update officielle).

## Modèle économique

- **Pay-as-you-go** : on achète des crédits qui ne se périment **jamais**.
- Pas d'abonnement API mensuel — uniquement des recharges de crédits.
- Frozen credits : les crédits sont gelés au lancement de la tâche, débités au succès, remboursés en cas d'échec/expiration.
- Paiement via Stripe (CB, Apple Pay, Google Pay, Alipay, WeChat Pay selon région).

## Génération 3D (notre cas)

### Image → 3D (notre cas principal)

| Model version | Sans texture | + Standard texture | + HD texture (`texture_quality=detailed`) |
|---|---|---|---|
| **P1 (Latest)** ✅ | 40 | **50** | **60** |
| Turbo V1.0 / V3.1 / V3.0 / V2.5 / V2.0 | 20 | 30 | 40 |
| V1.4 (fastest, vieux) | 30 | – | – |

Multiview → 3D : **même prix qu'Image → 3D** pour la même version (40/50 P1, 20/30 autres).

### Add-ons (s'empilent sur le prix de base)

| Option | Crédits | À utiliser ? |
|---|---|---|
| **HD Texture** (`texture_quality=detailed`) | +10 | ✅ Oui pour les plats |
| **Detailed Geometry** (`geometry_quality=detailed`, v3.0+) | +20 | ❌ Inutile pour la nourriture |
| **Quad Topology** | +5 | ❌ Force FBX, on veut GLB |
| **Style** | +5 | ❌ Pas de stylisation |
| **Low Poly** (`smart_low_poly=true`) | +10 | ❌ "May fail on complex models" |
| **Generate in parts** | +20 | ❌ Pas notre use case |

### Génération d'image (texte/image-to-image, pas 3D)

| Tâche | Crédits |
|---|---|
| `text_to_image` | 5 |
| `generate_image` (flux.1, gpt_4o, gemini, z_image) | 5 |
| `generate_image` (gpt_image_1.5, gpt_image_2, midjourney, gemini_3_pro) | 10 |
| `generate_multiview_image` | 10 |
| `edit_multiview_image` | 5 par vue éditée |

→ **Pas notre use case** : on a nos vraies photos. Mais utile à savoir si on veut un jour générer des plats fictifs (pour démo) ou compléter des vues manquantes via Tripo (alternative à notre `view_completion.py`).

### Texture stand-alone (re-texturer un modèle existant)

| Type | Crédits |
|---|---|
| Standard Texture | 10 |
| HD Texture | 20 |
| Style Reference | 5 |

→ Utile pour A/B-tester différentes textures sur le même mesh. Pas critique au lancement.

### Post-processing

| Opération | Crédits |
|---|---|
| Format Conversion - Basic (juste format) | 5 |
| Format Conversion - Advanced (face_limit, retopo...) | 10 |
| Post Stylization (lego, voxel...) | 20 |
| Post Low-poly | 30 |

→ La conversion en USDZ peut se faire ici (5 crédits) si on veut. Aujourd'hui on convertit via Blender headless dans `worker-ai/core/hunyuan.py` (gratuit). À voir si on garde Blender ou si on bascule sur Tripo conversion.

### Animation (HORS SCOPE)

Rigging 25 crédits, retarget 10 crédits/animation. Exclu par décision produit.

### Segmentation

Mesh segmentation 40 crédits, part completion 50 crédits. Pas notre use case.

## Coût par modèle dans la config recommandée ScanAr

**Config retenue** (voir [02-parametres-cles.md](./02-parametres-cles.md)) :
- `model_version: P1-20260311`
- `texture: true, pbr: true`
- `texture_quality: detailed`
- `auto_size: true, orientation: align_image, face_limit: 8000`
- `quad: false`

**Décompte** :
- Image-to-3D P1 + standard texture : **50 crédits**
- HD texture (texture_quality=detailed) : **+10 crédits**
- Quad : 0 (off)
- Style : 0 (off)
- Geometry detailed : 0 (off)

**Total = 60 crédits par modèle.**

## Conversion crédits → USD (CONFIRMÉ sur le dashboard 09/05/2026)

**Taux API officiel constaté** sur https://platform.tripo3d.ai/billing : **$1 = 100 crédits**, soit exactement **$0.01 par crédit**, **fixe** quel que soit le montant de recharge (de $1 à $100k).

Pas de palier dégressif visible sur le pay-as-you-go API. Pour obtenir un meilleur taux, il faut négocier un plan Enterprise (`support@tripo3d.ai`) — pas de tarif public.

### Studio ≠ API (piège de pricing)

L'abonnement **Tripo Studio** (web app) propose des crédits **2× moins chers** :

| Plan Studio | Prix/mois | Crédits | $/crédit |
|---|---|---|---|
| Basic | $0 | 300 | – |
| Professional | $19.90 (renouv) | 3000 | $0.0066 |
| Advanced | **$49.90 (renouv)** | **8000** | **$0.0062** |
| Premium | $139.90 (renouv) | 25000 | $0.0056 |

→ **Mais Studio = web UI manuel uniquement**. On ne peut PAS utiliser un abonnement Studio depuis le code. Pour ScanAr (SaaS automatisée), l'API à $0.01/crédit est la seule voie.

### Coût par modèle en USD — chiffres définitifs

Config recommandée (P1 + HD texture = 60 crédits) :

**60 crédits × $0.01 = $0.60 par modèle.** Fixe.

Variantes selon config :
- Config "premium" (P1 + HD texture + quad) → 65 crédits = **$0.65** (mais quad force FBX, pas notre cas)
- Config "économe" (P1 + standard texture) → 50 crédits = **$0.50**
- Config "très économe" (Turbo + HD texture) → 40 crédits = **$0.40** (qualité légèrement inférieure)
- Config "minimum viable" (Turbo + standard texture) → 30 crédits = **$0.30**

## Coûts projetés ScanAr

### Par restaurant (40 plats)

| Config | Coût Tripo / restaurant |
|---|---|
| P1 + HD texture (recommandé) | 40 × $0.60 = **$24** |
| Turbo + HD texture | 40 × $0.40 = **$16** |
| Turbo + standard texture (MVP cheap) | 40 × $0.30 = **$12** |

### Sur 100 restaurants (4000 plats — scaling)

- P1 + HD texture : 4000 × $0.60 = **$2 400 one-time**
- Turbo + HD texture : 4000 × $0.40 = **$1 600 one-time**

→ À ce volume, **demander un plan Enterprise à Tripo** (potentiellement -30 à -50% du tarif API). Le seuil typique de négociation chez ce genre de fournisseur : **$500-1000/mois** d'achat de crédits récurrent.

### Vs ton projet de pricing utilisateur

Tu mentionnais "60€/mois pour 10 modèles, 100€/mois pour 20 modèles".

| Plan ScanAr | Revenu | Coût Tripo (P1 + HD) | Coût Tripo (Turbo + HD) | Marge brute IA |
|---|---|---|---|---|
| 60€/mois × 10 modèles | ~$66 | $6 | $4 | **91% / 94%** |
| 100€/mois × 20 modèles | ~$110 | $12 | $8 | **89% / 93%** |

→ Ton pricing reste **largement viable**. Même avec la config la plus chère (P1 + HD), tu gardes 89-91% de marge brute sur la part IA. Le vrai coût marginal sera ailleurs (R2 storage, Cloudflare bandwidth, OpenAI pour l'enhance/sizing, frontend hosting).

**Important** : ce calcul est en **coût marginal de génération uniquement**. À retrancher aussi : Stripe (~3% sur 60€ = ~2€), serveurs fixes, support, acquisition utilisateur. Mais ça reste un SaaS très sain économiquement.

## Comparatif vs notre pipeline actuel (Hunyuan3D self-hosted)

| Coût mensuel | Hunyuan3D (actuel) | Tripo (futur) |
|---|---|---|
| Génération elle-même | $0 (compute amorti) | ~$0.60/modèle |
| Compute GPU H100/A100 | ❓ ~$200-500/mois si dédié, ou amortissement de ton PC | $0 |
| Maintenance | Du temps humain (toi) | $0 |
| Qualité | Variable selon les vues / cleanup | Mieux (Tripo > Hunyuan3D pour image-to-3D selon les benchmarks 2026) |
| Latence | 60-180s (CPU/GPU dépendant) | ~30-90s |

→ Tripo devient rentable dès que tu génères **moins de ~300-700 modèles/mois** sur un GPU loué. En self-host sur ton PC, c'est moins simple à comparer (coût électrique faible, mais tu ne peux pas scaler à 15 utilisateurs simultanés).

**Pour la mise en prod commerciale : Tripo est le bon choix.** Pour le dev local : Hunyuan3D reste utile (pas de coût, latence acceptable).

## Important — Où vérifier les vrais prix

1. **Dashboard billing officiel** : https://platform.tripo3d.ai/billing — pour les paliers de recharge en USD
2. **Wallet API** : `GET /v2/openapi/user/balance` — montre le solde courant en crédits
3. **Logs `consumed_credit` dans le polling de tâche** — chaque réponse `success` retourne les crédits réellement consommés. À logger systématiquement pour le reporting.
