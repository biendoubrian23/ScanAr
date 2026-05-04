'use client';

import React, { useState } from 'react';
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
  Menu,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Models', href: '/dashboard/models', icon: Box },
  { label: 'AR Links', href: '/dashboard/ar-links', icon: Link2 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'text-sm font-medium',
        'transition-all duration-150',
        isActive
          ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-colors',
          isActive ? 'text-brand-400' : 'text-zinc-500 group-hover:text-zinc-300',
        )}
        aria-hidden="true"
      />
      {item.label}
      {isActive && (
        <ChevronRight
          className="w-3.5 h-3.5 ml-auto text-brand-500"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  const { user, profile, signOut } = useAuth();

  const avatarInitial =
    profile?.full_name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-5 pb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
          onClick={onClose}
        >
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'bg-gradient-to-br from-brand-600 to-brand-500',
              'shadow-lg shadow-brand-600/30',
            )}
          >
            <ScanLine className="w-4.5 h-4.5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold gradient-text">ScanAR</span>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="px-3 pb-4 pt-4 border-t border-white/8 space-y-2">
        {/* User card */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'bg-white/5 border border-white/8',
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
              'bg-gradient-to-br from-brand-600 to-brand-500',
              'text-white text-sm font-semibold',
              'shadow-md shadow-brand-600/20',
            )}
            aria-hidden="true"
          >
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl',
            'text-sm text-zinc-400 hover:text-red-400',
            'hover:bg-red-500/10 border border-transparent hover:border-red-500/20',
            'transition-all duration-150',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        className={cn(
          'fixed top-4 left-4 z-40 lg:hidden',
          'flex items-center justify-center w-9 h-9 rounded-xl',
          'bg-dark-900/90 backdrop-blur border border-white/10',
          'text-zinc-400 hover:text-zinc-200',
          'transition-colors duration-150',
        )}
      >
        <Menu className="w-4.5 h-4.5" aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64',
          'bg-dark-950/95 backdrop-blur-xl border-r border-white/8',
          'transition-transform duration-300 ease-in-out',
          'lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        <SidebarContent
          pathname={pathname}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop static sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col',
          'w-60 shrink-0',
          'bg-dark-950/80 backdrop-blur-xl',
          'border-r border-white/8',
        )}
        aria-label="Main navigation"
      >
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

export default Sidebar;
