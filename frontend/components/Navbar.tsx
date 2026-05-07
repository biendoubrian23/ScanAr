'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Fonctionnalités',    href: '/#fonctionnalites' },
  { label: 'Comment ça marche',  href: '/#comment-ca-marche' },
  { label: 'Catalogues AR',      href: '/#catalogues' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 inset-x-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-brand-600/25 group-hover:shadow-brand-500/35 transition-shadow">
              <ScanLine className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ScanAR</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl',
                'bg-brand-700 text-white',
                'shadow-md shadow-brand-700/20',
                'hover:bg-brand-800 hover:shadow-brand-700/30',
                'transition-all duration-200',
              )}
            >
              Commencer
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen ? 'true' : 'false'}
          >
            <div className="w-4 h-3.5 flex flex-col justify-between">
              <span className={cn('block h-0.5 bg-current transition-all duration-300', menuOpen && 'rotate-45 translate-y-[6px]')} />
              <span className={cn('block h-0.5 bg-current transition-all duration-300', menuOpen && 'opacity-0')} />
              <span className={cn('block h-0.5 bg-current transition-all duration-300', menuOpen && '-rotate-45 -translate-y-[6px]')} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu — fixed overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-[69px] inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl px-6 py-5 flex flex-col gap-3">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 py-1.5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm text-gray-600 py-1.5"
                onClick={() => setMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition-colors"
              >
                Commencer <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
