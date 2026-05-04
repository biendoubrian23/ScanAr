import Link from 'next/link';
import { ScanLine, Link2Off } from 'lucide-react';

interface ARLinkExpiredProps {
  slug: string;
  title?: string;
}

/**
 * Public-facing page rendered when someone scans a QR whose AR link has been
 * deactivated by its creator. Sober design — no marketing fluff, just a clear
 * status and a path back to ScanAR.
 */
export function ARLinkExpired({ slug, title }: ARLinkExpiredProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">ScanAR</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto bg-amber-50 border border-amber-100">
            <Link2Off className="w-7 h-7 text-amber-600" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Ce lien AR n'est plus disponible
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed">
            {title ? (
              <>
                L'expérience <span className="font-medium text-gray-900">« {title} »</span> a été
                désactivée par son créateur et n'est plus accessible.
              </>
            ) : (
              "Cette expérience AR a été désactivée par son créateur et n'est plus accessible."
            )}
          </p>

          <p className="text-xs text-gray-500 font-mono mt-3">/{slug}</p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              Découvrir ScanAR
            </Link>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <ScanLine className="w-3 h-3 text-brand-600" />
        <span className="text-[10px] text-gray-500">
          Propulsé par <span className="text-brand-600 font-medium">ScanAR</span>
        </span>
      </footer>
    </div>
  );
}

export default ARLinkExpired;
