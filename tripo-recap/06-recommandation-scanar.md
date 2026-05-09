# Recommandation finale ScanAr + critique GPT

## TL;DR — par où commencer

**Config par défaut** (image_to_model OU multiview_to_model selon nb de photos) :

```json
{
  "model_version": "P1-20260311",
  "texture": true,
  "pbr": true,
  "texture_quality": "detailed",
  "auto_size": true,
  "orientation": "align_image",
  "face_limit": 8000,
  "quad": false
}
```

**Coût** : 60 crédits par modèle = **$0.60 par modèle** (taux API confirmé : $0.01/crédit fixe sur https://platform.tripo3d.ai/billing).

> ⚠️ **Important** : l'API est 2× plus chère que l'abonnement Tripo Studio ($0.01/crédit vs $0.005-0.006/crédit). C'est documenté chez eux — Studio = web UI manuel, API = automatisation. **Pour ScanAr, l'API est obligatoire** (pas d'automatisation possible avec un abonnement Studio).
>
> Si le coût gêne, deux leviers à actionner avant de capituler :
> - **Config "économe"** : `model_version: Turbo-v1.0-20250506` + `texture_quality: detailed` → 40 crédits = **$0.40/modèle** (-33%). Qualité légèrement inférieure à P1 mais acceptable pour des plats simples.
> - **Plan Enterprise** : `support@tripo3d.ai` à partir de $500-1000/mois d'achats. Discount potentiel -30 à -50%.

**Concurrence** : limite Tripo = 5 jobs P1 en parallèle. Pour scaler à 15 utilisateurs simultanés, c'est notre queue Redis qui gère (déjà en place dans ScanAr) — pas un upgrade à payer.

**Multi-view** : utilise-la quand l'utilisateur fournit 2-4 photos. **Même prix qu'image-to-3D**, qualité supérieure. Si 1 seule photo, image_to_model direct.

## Critique de l'analyse GPT (avec un œil très critique comme demandé)

### ✅ Ce que GPT a juste

1. **"Image-to-3D, pas text-to-3D"** — Confirmé. Pour des plats réels, pas de débat : on a des vraies photos, on les utilise.
2. **"Detailed geometry inutile pour la nourriture"** — Confirmé. Coût +20 crédits, gain visuel quasi-nul pour un plat. Les textures (détaillées) portent 80% du réalisme.
3. **"Quad mesh = pas pour nous"** — Confirmé. `quad=true` force FBX, on veut GLB pour model-viewer.
4. **"Multi-view donne meilleure qualité"** — Confirmé techniquement. Plus l'angle est couvert, mieux la reconstruction.
5. **"Le vrai coût scalera ailleurs (storage / CDN / bandwidth)"** — Confirmé. À volume, R2 + Cloudflare bandwidth + Supabase egress dépasseront Tripo.
6. **"Tu génères une fois, tu réutilises à l'infini"** — Confirmé. Le modèle d'un plat ne change pas, c'est un asset froid.

### ❌ Ce que GPT a faux

#### 1. "Image-to-3D + detailed texture + standard geometry + pbr = ~80 crédits"

**Faux.** La doc officielle dit **60 crédits** pour cette config sur P1 (50 base + 10 HD texture). GPT a sur-estimé de ~33%. Pas dramatique mais montre qu'il n'a pas lu la table de pricing officielle.

#### 2. "Multi-view ~$0.50-0.80 par plat, plus cher qu'image-to-3D"

**Faux.** `multiview_to_model` coûte **exactement le même prix** que `image_to_model` (50 crédits avec texture standard sur P1). Pas de premium pour le multi-view en soi.

GPT a probablement confondu avec `generate_multiview_image` (synthèse de 4 vues à partir de 1 image, +10 crédits) — un service séparé qu'on ne va PAS utiliser, parce qu'on a déjà nos vraies photos OU `multiview_to_model` accepte les slots vides.

→ **Conclusion pratique** : si l'utilisateur fournit 4 photos, ça ne coûte rien de plus que s'il en fournit 1, mais la qualité du modèle 3D est meilleure. **Pas de raison de privilégier image_to_model si on a 2+ photos.**

#### 3. "Pipeline idéal : Three.js / R3F / AR.js / WebXR"

**Faux pour notre cas.** On utilise déjà **`@google/model-viewer`**, qui :
- Wrappe Three.js en interne
- Gère AR Quick Look (iOS) + Scene Viewer (Android) + WebXR automatiquement
- Aucun besoin d'AR.js (legacy, plus maintenu activement)
- 0 ligne de code Three.js / R3F à écrire

→ **Garder model-viewer, ignorer la reco GPT là-dessus.** AR.js est obsolète depuis ~2023, Three.js direct est over-engineering.

#### 4. "Coût ~$0.35 par modèle moyen"

**Trop optimiste sans contexte.** À $0.005-0.007/crédit (gros volume), 60 crédits = $0.30-0.42. GPT cite $0.35 ce qui tombe dans cette fourchette, mais sans préciser que c'est **conditionné à un gros pré-paiement de crédits**. Sur des petites recharges ($10-20), on est plutôt à $0.012-0.015/crédit, soit ~**$0.72-0.90 par modèle**.

→ **À vérifier sur ton dashboard billing.**

### 🤷 Ce que GPT a évoqué de façon floue : "freeGS"

Ton brief : *"si on utilise free-freeGS parce qu'il y a GPT qui m'a parlé de ça, bon bref, je ne sais pas trop pourquoi il parlait de ça"*.

Je pense que GPT parlait de **3D Gaussian Splatting** (3DGS, parfois écrit "free GS" ou "freeGS" pour la version open-source). C'est **une autre famille de représentation 3D**, complètement différente du mesh GLB qu'on génère.

**3DGS en bref** :
- Pas un mesh, mais un nuage de "splats" (gaussiennes 3D colorées) qui simule un volume
- Photorealisme exceptionnel pour des **scènes statiques** (musée, intérieur, paysage)
- Outils : Polycam, Luma AI, Postshot, libs open-source
- Demande **50-200 photos** pour entraîner correctement (vs 1-4 pour Tripo)
- Format de fichier : `.splat`, `.ply` (point cloud) — **pas du GLB**

**Pourquoi c'est mauvais pour ScanAr** :
1. **model-viewer ne rend PAS de Gaussian Splats** — ça casse notre stack AR existante
2. Mobile AR Quick Look (iOS) et Scene Viewer (Android) ne supportent que GLB/USDZ — pas de splats
3. Demander 50+ photos d'un plat à un utilisateur = friction inacceptable
4. Le "placement à l'échelle réelle" (notre ambition AR) marche moins bien avec des splats qu'avec des meshes

**Verdict 3DGS** : c'est une techno fascinante, mais **complètement à côté du problème ScanAr**. On reste sur **mesh GLB via Tripo**, point. À envisager peut-être plus tard pour un mode "vue 360° depuis un seul écran" (sans AR), mais c'est un produit différent.

## Ma reco produit, par phase

### Phase 1 — Bascule Tripo (semaine 1-2 après confirmation business)

**Code à écrire** :
1. `worker-ai/core/tripo.py` — wrapper du flow upload + create + poll + download
2. `worker-ai/utils/config.py` — ajouter `TRIPO_API_KEY` à `.env`
3. Remplacer dans `worker-ai/core/processor.py` l'appel à `generate_3d_with_usdz()` par `tripo.generate()` quand un flag `USE_TRIPO=true` est actif (feature flag pour basculer dev↔prod)
4. Garder Hunyuan3D en fallback en dev / si Tripo down (clé API manquante = fallback Hunyuan automatique)
5. Désactiver `view_completion.py` quand on utilise Tripo (multi-view natif Tripo)
6. Évaluer si `auto_size: true` Tripo peut remplacer notre étape `estimating_size` GPT-4o-mini

**Coût attendu pour le test initial** :
- 20 plats à $0.60 = **$12 de crédits Tripo**
- À acheter en pré-paiement avant le démarrage

### Phase 2 — Mesure et A/B test (semaine 3)

Sur 20 plats variés (steak, salade, sushi, dessert, soupe, plat de pâtes, sandwich…), comparer :
- **Pipeline A** : Hunyuan3D + GPT enhance + GPT view completion + GPT size + trimesh scaling (actuel)
- **Pipeline B** : Tripo P1 multiview + auto_size + skip GPT enhance/views

Métriques :
- Taille GLB (cible < 2 MB)
- FPS sur iPhone 12 / Pixel 6 (cible > 30 fps)
- Réalisme subjectif (vote interne)
- Coût total par plat (compute + API)
- Latence end-to-end (cible < 2 min)

### Phase 3 — Bascule prod (semaine 4)

Si Pipeline B gagne sur 4 critères / 5 → bascule prod, Hunyuan3D en backup dev. Sinon : analyse des écarts, ajustement params (face_limit, texture_quality, etc.).

### Phase 4 — Pricing utilisateur (mois 2-3)

Avec un coût marginal de **~$0.60/modèle** (config P1 + HD texture), tes paliers proposés :
- 60€/mois → 10 modèles → coût Tripo $6 → **marge ~90% sur la partie IA**
- 100€/mois → 20 modèles → coût Tripo $12 → **marge ~88%**

Ces marges sont saines mais n'incluent pas :
- R2 storage + bandwidth (~$0.015/GB egress) → ~$0.05-0.20 par modèle (visualisations AR cumulées)
- OpenAI gpt-4o-mini size estimation → ~$0.0005 par modèle (négligeable)
- gpt-image-1 enhance (si on garde) → ~$0.04 × N images uploadées (on devrait le **désactiver** par défaut quand on bascule sur Tripo)
- Frontend hosting, Cloudflare tunnel, Supabase Auth → coûts fixes serveur

Marge nette réaliste : **~80-85% sur la partie IA + storage**, ce qui est largement viable.

## Les 3 actions concrètes immédiates

### 1. Ouvre un compte API Tripo et achète $20 de crédits test

→ https://platform.tripo3d.ai → API Keys → créer la clé (commence par `tsk_`).
→ Acheter ~$20 de crédits (devrait donner ~1500-2500 crédits selon le palier) = de quoi générer 25-40 plats en config P1 + HD texture.

### 2. Vérifier les vraies prix par crédit

Sur le dashboard billing, capture le tarif exact $/crédit pour les paliers que tu vises. Mets à jour la section "Conversion crédits → USD" du fichier `03-pricing-credits.md` avec les vrais chiffres.

### 3. Décider : on garde Hunyuan3D en dev ou on supprime ?

Mon vote : **on garde Hunyuan3D en dev local**, on bascule sur Tripo en prod via feature flag `USE_TRIPO=true`. Avantages :
- Dev gratuit (pas de crédits brûlés à chaque test)
- Fallback en cas d'incident Tripo (panne, suspension de compte, etc.)
- Permet l'A/B test propre de la phase 2

Contrainte : maintenir 2 codes paths dans `worker-ai/`, mais c'est minimal — un `if config.use_tripo: tripo.generate(...) else: hunyuan.generate(...)`.

## Question ouverte que je n'ai pas tranchée seul

**`auto_size: true` Tripo vs notre estimation GPT-4o-mini** : sans test, je ne sais pas lequel donne de meilleurs résultats sur des plats. Tripo dit "scale to real-world dimensions in meters" mais ne précise pas comment (probablement le même genre de heuristique que GPT — identification d'objet + taille typique).

→ **Verdict** : tester les deux sur 5 plats divers avec des dimensions réelles connues (meter mesuré au mètre ruban), comparer l'erreur. Si Tripo `auto_size` est < 15% d'erreur en moyenne, on désactive notre étape GPT et on économise. Sinon on garde GPT (pipeline actuel) en parallèle de Tripo (juste pour la géométrie).
