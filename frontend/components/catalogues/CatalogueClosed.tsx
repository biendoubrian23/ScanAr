import Link from 'next/link';
import { Lock } from 'lucide-react';

export function CatalogueClosed({ slug, title }: { slug: string; title?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-5">
          <Lock className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {title ? `« ${title} »` : 'Ce catalogue'} n&apos;est pas disponible
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Son propriétaire l&apos;a temporairement désactivé. Revenez plus tard ou
          demandez-lui de le réactiver.
        </p>
        <p className="text-xs text-gray-400 font-mono">/c/{slug}</p>
        <Link
          href="/"
          className="inline-block mt-6 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
