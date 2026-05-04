# App Router Structure

Structure Next.js App Router.

**Dossiers**:
- `(auth)/` - Routes d'authentification (login, signup, logout)
- `(dashboard)/` - Routes du dashboard (protégées)
  - `models/` - Gestion modèles 3D
  - `ar-links/` - Gestion liens AR/QR
  - `analytics/` - Vue analytics
  - `settings/` - Paramètres utilisateur
- `(landing)/` - Landing page publique
- `[...]/` - Dynamic routes (ex: partage public AR)

**Files**:
- `layout.tsx` - Layout principal
- `page.tsx` - Route par défaut

⚠️ Groupes entre parenthèses ne changent pas URL
