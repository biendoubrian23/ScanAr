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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Models',     href: '/dashboard/models',     icon: Box },
  { label: 'AR Links',   href: '/dashboard/ar-links',   icon: Link2 },
  { label: 'Analytics',  href: '/dashboard/analytics',  icon: BarChart2 },
  { label: 'Settings',   href: '/dashboard/settings',   icon: Settings },
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
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm',
        'transition-colors duration-100',
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-normal',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0',
          isActive ? 'text-gray-700' : 'text-gray-400',
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

      {/* Workspace header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500 shadow-sm">
            <ScanLine className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">ScanAR</span>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Bottom: user */}
      <div className="px-2 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 bg-brand-500 text-white text-xs font-semibold"
            aria-hidden="true"
          >
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate leading-tight">
              {profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight">
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md mt-0.5',
            'text-sm text-gray-500 hover:text-red-600 hover:bg-red-50',
            'transition-colors duration-100',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        className={cn(
          'fixed top-3 left-3 z-40 lg:hidden',
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'bg-white border border-gray-200 shadow-sm',
          'text-gray-500 hover:text-gray-700 transition-colors',
        )}
      >
        <Menu className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56',
          'bg-white border-r border-gray-200 shadow-lg',
          'transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-56 shrink-0 bg-white border-r border-gray-200"
        aria-label="Main navigation"
      >
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

export default Sidebar;
