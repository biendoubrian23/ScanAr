# Database (Supabase)

## Plateforme
- **Supabase hosted** : `https://rtwlwilronfcdatsjyab.supabase.co` (URL dans `.env`).
- Postgres + Auth + Storage + Realtime.
- Pas de DB locale — pas de docker pour Postgres.

## Migrations
Fichiers SQL numérotés dans [database/migrations/](../../database/migrations/) :
- `001_tables_users.sql`
- `002_tables_models_3d.sql`
- `003_tables_ar_links.sql`
- `004_tables_analytics.sql`
- `005_enable_realtime.sql`
- `006_pipeline_steps.sql`
- `007_dashboard_metadata.sql`

**Exécution** : copier-coller dans le SQL Editor de Supabase Dashboard. Pas de CLI configurée.

## RLS
Toutes les policies sont consolidées dans [database/policies/all_rls_policies.sql](../../database/policies/all_rls_policies.sql). Re-exécuter en cas de doute pour reset.

## Storage
- Buckets définis dans [database/storage/](../../database/storage/) :
  - `images` — uploads source utilisateur
  - `models-glb` — modèles Android
  - `models-usdz` — modèles iOS
- R2 Cloudflare configuré dans `.env` mais **pas utilisé pour le MVP** (commentaire dans `.env`).

## Realtime
Migration `005_enable_realtime.sql` active Realtime sur les tables clés (modèles, pipeline_steps) → le frontend peut s'abonner aux mises à jour de status sans poll.

## Si on doit changer le schéma
1. Créer un nouveau fichier `00X_*.sql` numéroté.
2. Le faire exécuter par le user dans le SQL Editor (pas d'application automatique).
3. Mettre à jour les types TS dans `frontend/types/` si concerné.
