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
        'flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-full',
        'transition-all duration-150',
        active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <div className={cn(
        'p-1.5 rounded-full transition-all duration-150',
        active ? 'bg-brand-500/12' : '',
      )}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
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

  useEffect(() => { setOptionsOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const openUpload = () => {
    setOptionsOpen(false);
    setUploadOpen(true);
  };

  return (
    <>
      {optionsOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/15 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <div
        ref={wrapperRef}
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      >
        {/* Upload options popover — glass morphism */}
        {optionsOpen && (
          <div
            role="menu"
            className={cn(
              'absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-[min(20rem,calc(100vw-1.5rem))]',
              'rounded-3xl bg-white/50 backdrop-blur-2xl overflow-hidden',
              'border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]',
              'animate-[fade-in-up_200ms_ease-out]',
            )}
          >
            <button
              type="button"
              role="menuitem"
              onClick={openUpload}
              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/60 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
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
              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/60 text-left transition-colors border-t border-gray-100/40"
            >
              <div className="w-9 h-9 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
                <Layers className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Multi-photos</p>
                <p className="text-xs text-gray-500">1 à 4 angles pour un meilleur rendu 3D</p>
              </div>
            </button>

            <div className="px-4 py-3.5 flex items-start gap-3 opacity-50 cursor-not-allowed border-t border-gray-100/40">
              <div className="w-9 h-9 rounded-2xl bg-gray-100/60 flex items-center justify-center shrink-0">
                <Video className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700">Depuis une vidéo</p>
                <p className="text-xs text-gray-400">Capture multi-angle automatique</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 bg-gray-100/70 px-1.5 py-0.5 rounded-full shrink-0">
                Bientôt
              </span>
            </div>
          </div>
        )}

        {/* Bottom nav bar — glass pill */}
        <nav
          aria-label="Navigation principale mobile"
          className={cn(
            'bg-white/40 backdrop-blur-2xl',
            'border-t border-white/50',
            'shadow-[0_-8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
            'rounded-t-3xl',
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
                aria-expanded={optionsOpen ? 'true' : 'false'}
                className={cn(
                  '-translate-y-5 inline-flex items-center justify-center',
                  'w-14 h-14 rounded-full bg-brand-600 text-white',
                  'shadow-[0_8px_24px_rgba(13,148,136,0.4)] ring-4 ring-white/80',
                  'hover:bg-brand-700 active:scale-95 transition-all duration-200',
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
