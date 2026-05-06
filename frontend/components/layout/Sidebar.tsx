'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  Link2,
  BarChart2,
  Settings,
  LogOut,
  ScanLine,
  X,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMobileSidebar } from '@/lib/stores/mobileSidebarStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Espace de travail',
    items: [
      { label: 'Tableau de bord', href: '/dashboard',             icon: LayoutDashboard },
      { label: 'Modèles',         href: '/dashboard/models',      icon: Box },
      { label: 'Mes catalogues',  href: '/dashboard/catalogues',  icon: LayoutGrid },
      { label: 'Liens AR',        href: '/dashboard/ar-links',    icon: Link2 },
    ],
  },
  {
    label: 'Compte',
    items: [
      { label: 'Analytique', href: '/dashboard/analytics', icon: BarChart2 },
      { label: 'Paramètres', href: '/dashboard/settings',  icon: Settings },
    ],
  },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[14px]',
        'transition-all duration-150',
        isActive
          ? 'bg-brand-500/12 text-brand-700 font-semibold shadow-[0_2px_8px_rgba(13,148,136,0.12)]'
          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 font-medium',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] shrink-0',
          isActive ? 'text-brand-600' : 'text-gray-400',
        )}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { user, profile, signOut } = useAuth();

  const avatarInitial =
    profile?.full_name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <div className="flex flex-col h-full">
      {/* Logo header */}
      <div className="flex items-center justify-between px-5 h-[81px] border-b border-white/30 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 shadow-[0_2px_8px_rgba(13,148,136,0.35)]">
            <ScanLine className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">ScanAR</span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la barre latérale"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-6 space-y-7 overflow-y-auto"
        aria-label="Navigation principale"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3.5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-white/30">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-full hover:bg-white/60 transition-colors">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-brand-600 text-white text-xs font-semibold shadow-[0_2px_6px_rgba(13,148,136,0.3)]"
            aria-hidden="true"
          >
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full mt-1',
            'text-[14px] text-gray-600 hover:text-red-600 hover:bg-red-50/60',
            'transition-colors duration-150',
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64',
          'bg-white/55 backdrop-blur-2xl border-r border-white/40',
          'shadow-[20px_0_60px_rgba(0,0,0,0.08)]',
          'transition-transform duration-200 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        <SidebarContent pathname={pathname} onClose={close} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-56 shrink-0 bg-white/40 backdrop-blur-2xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.04)]"
        aria-label="Main navigation"
      >
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

export default Sidebar;
