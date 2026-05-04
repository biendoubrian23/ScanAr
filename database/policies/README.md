# Policies RLS (Row-Level Security)

Configuration sécurité d'accès aux données Supabase.

**Format**: `table_name_policies.sql`

**Contenu**:
- Définir qui peut lire/créer/modifier/supprimer chaque table
- Exemples: user_policies.sql, models_policies.sql, etc

**Principe**: 
- Users voir uniquement leurs propres données
- Propriétaire peut modifier
- Public voir AR links
