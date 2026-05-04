# API Routes

Endpoints API Next.js (gateway vers backend/services).

**Routes à créer**:
- `api/auth/` - Login, signup, logout
- `api/models/` - Upload, liste, détail, delete modèles
- `api/ar-links/` - Créer liens, générer QR, analytics
- `api/webhooks/` - Recevoir notifications worker
- `api/config/` - Configuration client

Chaque route:
- Validée
- Authentifiée (sauf publiques)
- Error handling
