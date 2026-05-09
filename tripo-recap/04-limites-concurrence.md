# Limites & concurrence

Source : `Doc Tripo/21-limit.md` — la totalité de la page tient dans cette table. Très court mais critique.

## Limites par groupe de tâches

| Groupe | Concurrent max | S'applique à |
|---|---|---|
| **P1 Model Generation** | **5** | `text_to_model`, `image_to_model`, `multiview_to_model` avec `model_version=P1-20260311` |
| **Standard Model Generation** | **10** | `text_to_model`, `image_to_model`, `multiview_to_model` avec autres versions (Turbo, V3.x, V2.x, V1.4) |
| Multiview Image Generation | 1 | `generate_multiview_image` (synthèse de 4 vues depuis 1 image, pas notre cas) |
| Multiview Image Editing | 1 | `edit_multiview_image` |
| Refine | 5 | `refine_model` |
| Animation | 10 | `animate_*` (hors scope) |
| Other Tasks | 10 | tous les autres types |

## Upload (rate limit séparé)

**10 QPS** sur `POST /upload/sts` (et probablement `/upload/sts/token`).

→ Pour 15 utilisateurs simultanés qui uploadent chacun 4 photos, c'est 60 uploads en rafale. À 10 QPS, on étale sur 6 secondes — facile à respecter avec une queue côté worker.

## Le scénario "15 utilisateurs simultanés" du brief

> *"L'idée sera aussi de faire en sorte que je puisse envoyer par exemple 15 générations en même temps si par exemple il y a 15 utilisateurs qui utilisent en même temps."*

**Réalité brute** : avec **P1 (notre choix)**, tu es plafonné à **5 tâches concurrentes**. Avec une version standard (Turbo, V3.x, V2.x), tu montes à **10 tâches concurrentes**. **Aucune version ne permet 15 en parallèle** sur un compte par défaut.

## Trois solutions possibles

### Solution 1 (recommandée) — Queue serveur, transparent pour l'utilisateur

Notre worker-ai a déjà une queue Redis (`scanar:jobs`). Au lieu d'envoyer les 15 tâches d'un coup à Tripo, on en pousse 5 (limite P1), on attend qu'une finisse, on en pousse une nouvelle, etc.

**Implementation** :
- Compteur in-flight dans Redis : `INCR tripo:in_flight` au début, `DECR` à la fin
- Si compteur >= 5, le job reste en queue et on retente dans 3-5s
- Aucune erreur 429, aucune dégradation côté utilisateur — juste une latence d'attente naturelle (~30-90s par génération de toute façon, 15 jobs = 5 batches × 90s = ~7-8 min pour traiter tous, ce qui est acceptable pour un MVP)

**Coût** : 0. Juste du code dans `worker-ai/main.py`.

### Solution 2 — Mixer les versions de modèle

Si la latence est critique, on peut router :
- 5 premiers jobs → P1 (qualité top, 5 slots)
- 6e à 15e → Turbo-v1.0 ou V3.1 (10 slots, qualité quand même bonne)

Total théorique : **15 concurrent**. Mais qualité hétérogène (les utilisateurs n°6+ auront un modèle légèrement moins bon).

**Coût** : 30 crédits Turbo+texture vs 50 crédits P1+texture → moins cher pour les jobs bas-priorité, mais moins beau.

### Solution 3 — Plan Enterprise / multiple API keys

La doc évoque "Special discounts are also available for teams, studios, and enterprises". Un plan Enterprise pourrait débloquer une concurrence > 5/10. À demander à `support@tripo3d.ai` quand on aura du volume.

Multiple API keys n'est **pas une solution propre** — chaque clé est isolée (un job avec clé A n'est pas visible par clé B), ce qui complique la logique.

## Recommandation ScanAr pour la concurrence

**Phase 1 (MVP, < 50 utilisateurs/jour)** :
→ Solution 1 (queue Redis, max 5 concurrent P1).
→ Latence moyenne : 30-90s par job. 15 jobs en file = ~5-8 min total. **Acceptable** car les utilisateurs ne sont pas en attente bloquante (ils peuvent fermer l'onglet et revenir).

**Phase 2 (50-500 utilisateurs/jour)** :
→ Solution 2 (mix P1 + Turbo) si on observe vraiment des pics simultanés > 5.
→ OU négocier un plan Enterprise avec Tripo si volume justifie.

**Phase 3 (> 500/jour)** :
→ Plan Enterprise obligatoire. Volume justifie une discussion commerciale.

## Comportement en cas de dépassement

Si on dépasse la concurrence sans gestion serveur :
- HTTP 429 sur `POST /task`
- Body : `{ "code": 2000, "message": "You have exceeded the limit of generation", "suggestion": "Please retry later. ... Retry-After header." }`
- Header `Retry-After` à respecter (Tripo te dit explicitement combien de secondes attendre)

Le worker doit :
1. Catch 429
2. Lire `Retry-After`
3. Re-pousser le job en queue Redis avec ce délai
4. Pas considérer ça comme un échec utilisateur

## Tâche `generate_multiview_image` — le piège à 1 concurrent

Si on utilise `generate_multiview_image` (synthèse de 4 vues depuis 1 photo unique), on est limité à **1 tâche à la fois** sur ce groupe spécifique. **Bottleneck énorme** si on l'utilise systématiquement.

→ **Notre stratégie** : ne PAS utiliser `generate_multiview_image`. Si l'utilisateur fournit 1 seule photo, on appelle directement `image_to_model` (qui génère le 3D depuis 1 image). Si il fournit 2-4 photos, on appelle `multiview_to_model` (qui prend les vraies photos directement). Pas besoin de Tripo pour générer les vues manquantes.

**Comparaison avec notre `view_completion.py` actuel** : nous générons des vues manquantes via gpt-4o + gpt-image-1, ce qui est cher (~$0.15-0.30 par vue) et ajoute 1-3 minutes au pipeline. **Tripo n'a pas besoin de toutes les vues** — `multiview_to_model` accepte les slots vides (`{}`) tant que la front view est fournie. Donc on peut **supprimer view_completion** quand on bascule sur Tripo.
