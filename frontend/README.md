# 🎨 Frontend - ScanAR

Interface utilisateur complète de la plateforme ScanAR.

## 📋 Contenu

### App Structure
- **app/** - Next.js App Router
  - **(auth)/** - Pages d'authentification (login, signup)
  - **(dashboard)/** - Dashboard utilisateur (protégé)
  - **(landing)/** - Landing page publique
  - **layout.tsx** - Layout principal
  - **page.tsx** - Route par défaut

### Pages & Fonctionnalités
- Landing page (CTA, démo 3D)
- Auth (email/password)
- Dashboard
  - Upload image
  - Historique modèles 3D
  - Gestion liens AR/QR codes
  - Analytics (nombre de scans)
  - Settings profil

### Components
- **components/** - Composants réutilisables
  - UI génériques
  - 3D viewer (Three.js)
  - AR viewer (model-viewer)
  - Forms
  - Navigation

### Utils & Services
- **lib/** - Utilitaires
  - API client (fetch wrapper)
  - Auth helpers
  - Supabase client
- **hooks/** - React hooks personnalisés
  - useAuth
  - useUpload
  - useAR

### Styling
- Tailwind CSS (configuration Tailwind)
- SCSS si besoin

### Assets
- **public/** - Images, icônes, polices

## 🚀 Tech Stack
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**
- **Three.js** (3D visualization)
- **model-viewer** (AR visualization)
- **Supabase JS client**

## 📦 Dependencies
- next
- react
- typescript
- tailwindcss
- three
- @react-three/fiber
- @google/model-viewer
- @supabase/supabase-js

## 🔄 Communication
- API Routes backend (/api/...)
- WebSocket pour progress uploads
