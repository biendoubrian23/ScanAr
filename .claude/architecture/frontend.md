# Frontend (Next.js 14 App Router)

## Structure
```
frontend/
├── app/
│   ├── page.tsx              # Landing page (hero + sections)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind + variables CSS
│   ├── login/  signup/       # Auth pages
│   ├── dashboard/            # User dashboard
│   ├── ar/                   # AR viewer page
│   └── api/                  # API routes (= "backend" du projet)
│       ├── models/           # CRUD modèles 3D
│       ├── ar-links/         # Liens AR + QR
│       ├── analytics/        # Tracking scans
│       ├── storage/          # Upload images
│       └── webhooks/worker/  # Callback worker-ai → frontend
├── components/
│   ├── ui/                   # Modal, Button, etc. (génériques)
│   ├── layout/               # Navbar, etc.
│   ├── viewers/              # 3D + AR viewers
│   ├── pipeline/             # Steps UI generation
│   └── dashboard/
├── hooks/                    # useAuth, useUpload, useARViewer...
├── lib/                      # supabase client, api-client, auth helpers
├── types/                    # TS types
├── public/images/herosection/  # 4 images du carousel hero
└── tailwind.config.ts        # brand-* = bleu, surface = #fafafa
```

## Stack clé
- **Next.js 14.2.3** (App Router, standalone output pour Docker)
- **Tailwind 3.4** + classes custom dans `globals.css` (`.gradient-text`, `.card`)
- **framer-motion** pour les animations
- **lucide-react** pour les icônes
- **@supabase/ssr** + `@supabase/supabase-js` côté client/serveur
- **ioredis** pour la queue depuis les API routes
- **@google/model-viewer** pour le rendu 3D/AR (web component)
- **react-dropzone** pour l'upload, **sharp** pour le traitement image, **qrcode** pour les QR

## Conventions Tailwind
- Couleur de marque : `brand-{50..950}` = palette bleue (Tailwind blue).
- Background pages : `bg-surface` (#fafafa) + `text-gray-900`.
- Le hero utilise `teal-700` localement (pas encore propagé en couleur de marque).

## Type-check
```bash
cd frontend && npx tsc --noEmit
```
Silence = OK. Le projet a `tsconfig.tsbuildinfo` versionné.

## Hot points
- [app/page.tsx](../../frontend/app/page.tsx) — landing complète, 1 seul fichier (Hero, Pipeline, Features, UseCases, CTA, Footer + DemoModal).
- [app/globals.css](../../frontend/app/globals.css) — variables CSS, scrollbar custom, keyframes (shimmer, float, fade-in-up).
- [middleware.ts](../../frontend/middleware.ts) — auth middleware Supabase.
