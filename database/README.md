# 🗄️ Database - ScanAR

Scripts SQL et configurations Supabase pour structure données.

## 📋 Contenu

### Organisation des Scripts

```
database/
├── migrations/          → Scripts de création (exécutés une fois)
│   ├── 001_tables_users.sql
│   ├── 002_tables_models.sql
│   ├── 003_tables_ar_links.sql
│   └── 004_tables_analytics.sql
│
├── policies/            → Row-Level Security (RLS)
│   ├── users_policies.sql
│   ├── models_policies.sql
│   ├── ar_links_policies.sql
│   └── analytics_policies.sql
│
└── storage/             → Configuration Supabase Storage
    ├── buckets_setup.sql
    └── storage_policies.sql
```

## 📊 Tables à Créer

### users
- id (UUID PK)
- email (unique)
- password_hash
- created_at
- updated_at
- credits (futur)

### models_3d
- id (UUID PK)
- user_id (FK users)
- original_image_url
- model_glb_url
- model_usdz_url
- status (pending, processing, completed, failed)
- created_at
- updated_at

### ar_links
- id (UUID PK)
- user_id (FK users)
- model_id (FK models_3d)
- slug (unique identifier)
- qr_code_url
- created_at

### analytics
- id (UUID PK)
- ar_link_id (FK ar_links)
- device_type (iOS, Android, web)
- scanned_at
- ip_address (optionnel)

### storage_buckets
- images (images originales)
- models-glb (modèles 3D .glb)
- models-usdz (modèles 3D .usdz)

## 🔐 Sécurité (RLS)

### Policies
- Utilisateurs ne peuvent voir que leurs propres données
- Utilisateurs ne peuvent créer/modifier que leurs propres modèles
- AR links publiques lisibles par tous, modifiables propriétaire seulement
- Analytics read-only

## 🚀 Exécution

1. Créer migrations (dans l'ordre numérique)
2. Appliquer RLS policies
3. Configurer Storage buckets
4. Seed données initiales si besoin

## ⚙️ Connexion

- Service: Supabase
- DB: PostgreSQL
- URL: Récupérée depuis .env SUPABASE_URL
- Key: SUPABASE_ANON_KEY (frontend), SUPABASE_SERVICE_KEY (backend)

## 📝 À Ajouter

À chaque création de table/policy/storage:
- 1 fichier SQL dédié
- Numérotation séquentielle
- Commentaires explicatifs
