# Tripo3D — Récap ScanAr

Résumé focalisé ScanAr de la doc officielle Tripo3D (scrapée dans `Doc Tripo/`).
Pas de code superflu, juste l'essentiel pour décider et implémenter.

## Sommaire

1. [Essentiels — auth, base URL, flow async](./00-essentiels.md)
2. [Workflow image-to-3D pour ScanAr](./01-flow-image-to-3d.md)
3. [Paramètres clés (les 8 qui comptent)](./02-parametres-cles.md)
4. [Pricing & crédits — chiffres officiels](./03-pricing-credits.md)
5. [Limites & concurrence](./04-limites-concurrence.md)
6. [Erreurs API à gérer](./05-erreurs-cles.md)
7. **[Recommandation finale + critique GPT](./06-recommandation-scanar.md)** ← commence ici si tu veux la conclusion

## Hors scope

- **Animation / rigging** — exclu par décision produit
- **Stylization (lego, voxel, minecraft, voronoi)** — pas pour des plats
- **Mesh editing / segmentation** — pas nécessaire pour notre pipeline
- **Text-to-3D** — on génère depuis des photos réelles, pas du texte

Pour ces sujets, voir directement `Doc Tripo/13-mesh-editing.md`, `Doc Tripo/14-animation.md`,
`Doc Tripo/15-post-process.md` (section Stylization).

## Date du recap

Basé sur le scrape du 9 mai 2026. Les prix `generate_image` ont été mis à jour par
tier de modèle le 17/04/2026 — vérifier `Doc Tripo/19-pricing-billing.md` si on
revient dessus dans plusieurs mois.
