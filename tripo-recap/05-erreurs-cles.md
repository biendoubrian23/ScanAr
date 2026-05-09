# Erreurs API à gérer

Source : `Doc Tripo/18-error-handling.md`. Les codes les plus probables qu'on va rencontrer en prod ScanAr.

## Format universel

Toute erreur Tripo retourne :

```json
{ "code": 1234, "message": "...", "suggestion": "..." }
```

Plus le header `X-Tripo-Trace-ID` à logger systématiquement.

## Top 10 des erreurs à gérer dans le worker

| HTTP | Code | Description | Action côté ScanAr |
|---|---|---|---|
| **429** | **2000** | Limite de génération dépassée (concurrence) | Lire `Retry-After`, re-pousser le job dans Redis avec délai |
| 429 | 1007 | Rate limit général (trop de requêtes par seconde) | Backoff exponentiel, retry |
| **401** | **1002** | Auth échouée | Clé API invalide/révoquée — alerter ops, ne PAS retry |
| 400 | 1003 | Body malformé | Bug dans notre code — alerter, pas de retry |
| 400 | 1004 | Param invalide | Bug dans notre code — alerter, pas de retry |
| **403** | **2010** | Pas assez de crédits | Alerte critique — bloquer les nouveaux jobs, notif admin pour recharge |
| 404 | 2001 | Tâche non trouvée | Le `task_id` est faux ou n'appartient pas à cette clé. Marquer le job comme failed |
| 400 | 2003 | Fichier image vide | Image corrompue côté ScanAr — failed propre |
| 400 | 2004 | Format fichier non supporté | Ne devrait pas arriver (on filtre côté frontend), mais à logger |
| 400 | 2008 | Contenu rejeté (content policy) | Photo problématique — surface à l'user "image refusée" |

## Erreurs serveur (à retry)

| HTTP | Code | Description |
|---|---|---|
| 500 | 1000 | Unknown error côté Tripo |
| 500 | 1001 | Fatal error côté Tripo |
| 500 | 2014 | Audit service error |

→ Retry avec backoff exponentiel (1s, 2s, 4s, 8s, abandon après 5 essais).
→ Logger systématiquement le `X-Tripo-Trace-ID` avant le retry — c'est ce que le support voudra.

## Erreurs spécifiques à anticiper

### 2010 — Crédits insuffisants

C'est le plus important pour la prod. Stratégie :

1. **Monitoring proactif** : cron qui appelle `GET /v2/openapi/user/balance` toutes les heures, alerte Slack/email si `balance < 1000` crédits (~17 modèles).
2. **Pré-check au lancement de tâche** : avant de pousser un job, vérifier qu'on a au moins 60 crédits disponibles. Si non, le job reste en queue avec `error: "low_credits"` et reprend dès qu'un opérateur recharge.
3. **Auto-recharge Stripe** : option à explorer plus tard — Tripo accepte les paiements Stripe, on pourrait wirer une auto-recharge si balance < seuil.

### 2008 — Content policy

Tripo a une modération automatique. Pour des plats, **très peu de risque** sauf si :
- L'utilisateur uploade par erreur une photo non-alimentaire (visage, scène, marque déposée visible)
- Image trop sexualisée (steak photographié sous angle X 🙃 — peu probable)

→ Côté UX : afficher "Cette image n'a pas été acceptée par le générateur 3D — essayez une autre photo du plat sous un angle différent" et permettre re-upload.

### Tâche en `failed` ou `expired` au polling

Différent des erreurs HTTP. La tâche a été créée OK mais a échoué pendant le traitement.

→ Le worker doit gérer ces cas dans la fonction de polling :
- `status: "failed"` → retry une fois (transient), puis marquer le model comme failed avec message user-friendly
- `status: "expired"` → marquer failed, log + alerte
- `status: "banned"` → idem 2008 (content policy)
- `status: "cancelled"` → ne devrait pas arriver côté nous (on n'annule rien)
- `status: "unknown"` → contacter support, marquer failed

## Logs à conserver pour le support

Pour chaque échec à reporter à `support@tripo3d.ai`, fournir :

```
- task_id (du POST /task)
- X-Tripo-Trace-ID (header de la réponse)
- Timestamp UTC
- Endpoint hit (POST /task ou GET /task/{id})
- Payload envoyé (sanitized — pas la clé API !)
- Réponse complète (code + message + suggestion)
- Image source (si pertinent — uploader sur ton bucket pour leur partager une URL)
```

→ Centraliser dans une table `tripo_errors` Supabase avec ces champs. Bonus : dashboard Grafana / interne pour suivre le taux d'échec.

## Checklist d'implementation côté worker-ai

Quand on fera le `core/tripo.py` :

- [ ] Wrapper httpx avec timeout 30s par requête
- [ ] Decorator retry exponentiel 1s/2s/4s/8s sur 5xx + 429
- [ ] Logger `X-Tripo-Trace-ID` à chaque réponse
- [ ] Parser le `code` même sur HTTP 200 (peut être ≠ 0 = erreur "soft")
- [ ] Map des codes → exceptions Python typées : `TripoAuthError`, `TripoRateLimitError`, `TripoCreditsError`, `TripoContentPolicyError`, `TripoServerError`
- [ ] Pour 2010 (crédits) : exception **non-retryable**, alerte ops immédiate
- [ ] Pour 2000 (concurrence) : exception retryable, retry après `Retry-After`
- [ ] Stocker chaque échec final dans `models_3d.error_message` au format `[code:1234] message — trace_id: xxx`
