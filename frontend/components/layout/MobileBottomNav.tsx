'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  LayoutGrid,
  Settings,
  Plus,
  ImagePlus,
  Layers,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadModal } from '@/components/dashboard/UploadModal';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_LEFT: NavItem[] = [
  { label: 'Accueil',  href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Modèles',  href: '/dashboard/models',  icon: Box },
];

const NAV_RIGHT: NavItem[] = [
  { label: 'Catalogues', href: '/dashboard/catalogues', icon: LayoutGrid },
  { label: 'Réglages',   href: '/dashboard/settings',   icon: Settings },
];

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 py-1.5',
        'transition-colors',
        active ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      <span className="text-[10px] font-medium leading-none">{item.label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOptionsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [optionsOpen]);

  // Close options on route change
  useEffect(() => { setOptionsOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const openUpload = () => {
    setOptionsOpen(false);
    setUploadOpen(true);
  };

  return (
    <>
      {/* Backdrop when options open — soft dim so the popover is the focus */}
      {optionsOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          aria-hidden="true"
        />
      )}

      <div
        ref={wrapperRef}
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      >
        {/* Upload options popover — anchored above the FAB */}
        {optionsOpen && (
          <div
            role="menu"
            className={cn(
              'absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-[min(20rem,calc(100vw-1.5rem))]',
              'rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden',
              'animate-[fade-in-up_200ms_ease-out]',
            )}
          >
            <button
              type="button"
              role="menuitem"
              onClick={openUpload}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <ImagePlus className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Depuis une image</p>
                <p className="text-xs text-gray-500">JPG, PNG, WebP — max 10 Mo</p>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={openUpload}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-t border-gray-100"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Layers className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Multi-photos</p>
                <p className="text-xs text-gray-500">1 à 4 angles pour un meilleur rendu 3D</p>
              </div>
            </button>

            <div className="px-4 py-3 flex items-start gap-3 opacity-60 cursor-not-allowed border-t border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Video className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700">Depuis une vidéo</p>
                <p className="text-xs text-gray-400">Capture multi-angle automatique</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                Bientôt
              </span>
            </div>
          </div>
        )}

        {/* The bottom nav bar — flush at the bottom edge with rounded top
            corners. Bottom safe-area padding is INSIDE the white surface so
            iOS Home indicator sits on the same background. */}
        <nav
          aria-label="Navigation principale mobile"
          className={cn(
            'bg-white border-t border-gray-200',
            'shadow-[0_-6px_20px_rgba(15,23,42,0.06)]',
            'rounded-t-2xl',
            'pb-[env(safe-area-inset-bottom)]',
          )}
        >
          <div className="grid grid-cols-5 items-center h-16 px-1">
            {NAV_LEFT.map((item) => (
              <NavTab key={item.href} item={item} active={isActive(item.href)} />
            ))}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setOptionsOpen((o) => !o)}
                aria-label="Nouveau modèle"
                aria-expanded={optionsOpen}
                className={cn(
                  '-translate-y-5 inline-flex items-center justify-center',
                  'w-14 h-14 rounded-full bg-brand-600 text-white',
                  'shadow-lg shadow-brand-600/30 ring-4 ring-white',
                  'hover:bg-brand-700 active:scale-95 transition-all',
                  optionsOpen && 'rotate-45 bg-brand-700',
                )}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {NAV_RIGHT.map((item) => (
              <NavTab key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
        </nav>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}

export default MobileBottomNav;
