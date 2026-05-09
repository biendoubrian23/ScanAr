# Paramètres clés — les 8 qui comptent pour ScanAr

Tripo expose 20+ params sur `image_to_model` / `multiview_to_model`. Pour des plats de restaurant en AR mobile, voici uniquement ceux qui ont un impact réel.

## 1. `model_version` — quel moteur de génération

| Version | Description | Coût base img→3D + texture | Recommandé pour |
|---|---|---|---|
| **`P1-20260311`** ✅ | **Latest model** (mars 2026) | **50 crédits** | Notre cible : low-poly propre, optimisé AR/mobile |
| `Turbo-v1.0-20250506` | Génération rapide | 30 crédits | Mode brouillon / preview |
| `v3.1-20260211` | Avant-dernière | 30 crédits | Si problème avec P1 |
| `v3.0-20250812` | Précédente | 30 crédits | Supporte `geometry_quality` (rare cas) |
| `v2.5-20250123` | **Default si non précisé** | 30 crédits | À éviter — vieille |
| `v2.0-20240919` | Ancienne | 30 crédits | – |
| `v1.4-20240625` | Fastest, low quality | 30 crédits | – |

**Choix ScanAr : `P1-20260311`.**
> Citation officielle : *"Optimized Low-Poly Generation: Produces clean, refined geometry specifically designed for low face count models. Ideal Use Cases: Game assets, stylized 3D content, mobile-optimized models, AR/VR applications. Fast Generation: ~2s mesh generation."* — c'est littéralement notre cas d'usage.

⚠️ **Limitation P1** : ne supporte qu'une liste précise de paramètres (pas tous ceux des anciennes versions). Les paramètres supportés sont listés en détail dans `Doc Tripo/11-generation.md` section "P1-20260311".

## 2. `texture_quality` — résolution des textures

- `"standard"` (default) — texture 2K, OK qualité moyenne
- `"detailed"` ✅ — texture 4K, **+10 crédits**

**Pour des plats de restaurant : `detailed` obligatoire.** Le réalisme d'un steak ou d'un plat de pâtes vient à 80% des textures (couleurs, détails de surface, pores) et pas de la géométrie.

## 3. `pbr` — matériaux physiquement réalistes

- `pbr: true` (default) — sortie avec roughness, metallic, normal maps → réagit correctement à la lumière en AR
- `pbr: false` — texture diffuse plate, "carton-pâte" sous éclairage AR

**Pour ScanAr : `pbr: true` toujours.** Pas d'extra coût (c'est inclus dans le prix de base si `texture: true`).

⚠️ Note : si `pbr=true`, le param `texture` est forcé à `true` même si tu mets `false`.

## 4. `face_limit` — budget de polygones

Impact direct sur la taille du GLB et les FPS sur mobile.

| `face_limit` | GLB approximatif | FPS mobile | Recommandation |
|---|---|---|---|
| 2000-3000 | ~500 KB | 60 fps facile | Très simple plats |
| **5000-8000** ✅ | ~1-2 MB | 50-60 fps | **Sweet spot ScanAr** |
| 10000-15000 | ~3-5 MB | 30-50 fps | Plats détaillés (sushis, salades complexes) |
| 20000 (max P1) | ~6-10 MB | risqué sur entry-level | Premium uniquement |

**Pour ScanAr : `face_limit: 8000` par défaut.** Suffit largement pour un plat, GLB léger pour AR web.

Si non précisé, Tripo l'ajuste automatiquement (`adaptively determined`) — mais on perd le contrôle de la taille du fichier.

## 5. `auto_size` — taille réelle automatique

- `auto_size: true` ✅ — Tripo scale le modèle en **mètres réels**
- `auto_size: false` (default) — unités arbitraires (comme Hunyuan3D aujourd'hui)

**Pour ScanAr : à tester en priorité.** Si `auto_size` est fiable sur des plats, on **désactive notre étape `estimating_size` GPT-4o-mini** et le scaling trimesh. Économie + simplification.

→ **Plan A/B test** : générer 5 plats avec `auto_size: true` et 5 avec notre pipeline GPT, comparer les bbox finales en cm. Si l'écart est < 15%, Tripo gagne.

## 6. `orientation` — orientation du modèle

- `"default"` — orientation libre choisie par le modèle
- `"align_image"` ✅ — rotation auto pour matcher la photo source

**Pour ScanAr : `orientation: align_image`.** Évite les modèles à l'envers ou tournés à 45°. Ne fonctionne que si `texture: true`.

## 7. `quad` — topologie quadrangulée

- `quad: false` (default) ✅ — sortie en triangles, format **GLB** (notre cas)
- `quad: true` — sortie en quads, **force le format FBX**, +5 crédits

**Pour ScanAr : `quad: false` toujours.** model-viewer attend GLB/USDZ, pas FBX. Aucun intérêt pour de l'AR web.

## 8. `enable_image_autofix` — pré-traitement Tripo

- `enable_image_autofix: false` (default)
- `enable_image_autofix: true` ✅ — Tripo nettoie l'image avant génération

**À évaluer** : on a déjà notre pipeline `enhance_images()` (gpt-image-1) qui fait du nettoyage / fond uni. Activer celui de Tripo en plus = double cleanup, possible perte de détails. **Tester les deux sur 5 plats** :
- A : enhance_images=ON (ScanAr) + autofix=OFF (Tripo)  ← actuel
- B : enhance_images=OFF + autofix=ON
- C : les deux ON
- D : les deux OFF (image originale)

Si B donne des résultats équivalents à A, on peut désactiver notre `gpt_enhance_enabled` par défaut → économie ~$0.04 par image (gpt-image-1) × N images uploadées.

## Paramètres qu'on n'utilise PAS

| Param | Pourquoi pas |
|---|---|
| `geometry_quality: detailed` | +20 crédits, géométrie ultra. Inutile pour des plats (les textures portent le réalisme). |
| `smart_low_poly` | +10 crédits, "may fail on complex models". Aléatoire, pas pour de la prod. |
| `generate_parts` | Incompatible avec `texture: true` ET `pbr: true`. Use case : éditeur 3D, pas AR. |
| `compress: geometry` | Alternative à meshopt, oblige à décompresser pour éditer. On utilise déjà Draco en post. |
| `export_uv: false` | Saute l'UV unwrapping → pas de texture propre. À éviter. |
| `style` | +5 crédits, style stylistique (lego, voxel, etc.). Pas pour la nourriture réaliste. |
| `model_seed` / `texture_seed` | Pour reproductibilité (debugging). Optionnel, à logger mais pas à fixer. |
| `texture_alignment` | `original_image` (default) est ce qu'on veut. |

## Configuration finale recommandée

Pour copier-coller dans le code du worker (cas 1 photo) :

```json
{
  "type": "image_to_model",
  "model_version": "P1-20260311",
  "file": { "type": "jpg", "file_token": "..." },
  "texture": true,
  "pbr": true,
  "texture_quality": "detailed",
  "auto_size": true,
  "orientation": "align_image",
  "face_limit": 8000,
  "quad": false
}
```

**Coût : 50 (P1 + standard texture) + 10 (HD texture) = 60 crédits par modèle.**

Pour cas 2-4 photos, identique mais `type: "multiview_to_model"` + `files: [...]` à la place de `file`.
