'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Link2,
  QrCode,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  BarChart2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ARLink } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function Toggle({
  checked, onChange, disabled, label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        checked ? 'bg-brand-500' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function ARLinkCard({
  link, onDelete, onToggleActive, toggling, deleting,
}: {
  link: ARLink;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const arUrl = `${APP_URL}/ar/${link.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(arUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!link.qr_url) return;
    const a = document.createElement('a');
    a.href = link.qr_url;
    a.download = `qr-${link.slug}.png`;
    a.click();
  };

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow',
      !link.is_active && 'opacity-70',
    )}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          {link.qr_url ? (
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-white p-0.5 border border-gray-200 shrink-0">
              <img src={link.qr_url} alt="QR code" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{link.title ?? link.slug}</p>
            <p className="text-xs text-gray-400 font-mono truncate">/{link.slug}</p>
          </div>
        </div>

        <Toggle
          checked={link.is_active}
          onChange={(v) => onToggleActive(link.id, v)}
          disabled={toggling}
          label={link.is_active ? 'Deactivate link' : 'Activate link'}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="tabular-nums font-medium text-gray-900">{link.scan_count}</span>
          <span className="text-xs text-gray-400">scans</span>
        </div>

        <Badge variant={link.is_active ? 'success' : 'default'}>
          {link.is_active ? 'Active' : 'Inactive'}
        </Badge>

        <span className="ml-auto text-xs text-gray-400">{formatDate(link.created_at)}</span>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className={cn('flex-1', copied && 'border-emerald-300 text-emerald-700')}
        >
          {copied
            ? <><CheckCircle2 className="w-3.5 h-3.5" />Copied!</>
            : <><Copy className="w-3.5 h-3.5" />Copy link</>}
        </Button>

        {link.qr_url && (
          <Button variant="ghost" size="sm" onClick={handleDownloadQR} title="Download QR code">
            <Download className="w-3.5 h-3.5" />
          </Button>
        )}

        <a
          href={arUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open AR viewer"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(link.id)}
          loading={deleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Delete AR link"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function ARLinksPage() {
  const [links, setLinks]     = useState<ARLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ARLink | null>(null);
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ar-links');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      setLinks(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AR links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/ar-links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        showToast('success', 'AR link deleted');
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Failed to delete link');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    setTogglingId(id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: active } : l)));
    try {
      const res = await fetch(`/api/ar-links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      });
      if (!res.ok) {
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: !active } : l)));
        showToast('error', 'Failed to update link status');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const totalScans  = links.reduce((s, l) => s + l.scan_count, 0);
  const activeCount = links.filter((l) => l.is_active).length;

  return (
    <DashboardShell title="AR Links & QR Codes">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg border',
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700',
          )}
        >
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      <div className="space-y-5 max-w-5xl">
        {!loading && links.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total links',  value: links.length, icon: <Link2         className="w-4 h-4 text-brand-500" />,    bg: 'bg-brand-50' },
              { label: 'Active links', value: activeCount,  icon: <CheckCircle2  className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50' },
              { label: 'Total scans',  value: totalScans,   icon: <BarChart2     className="w-4 h-4 text-sky-500" />,     bg: 'bg-sky-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', s.bg)}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums leading-none">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse">
                <div className="h-16 border-b border-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-7 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={fetchLinks} className="ml-auto text-red-700">
              Retry
            </Button>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-brand-50 border border-brand-100">
              <QrCode className="w-7 h-7 text-brand-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No AR links yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Create your first AR link from a completed 3D model on the{' '}
              <a href="/dashboard/models" className="text-brand-600 hover:text-brand-700">Models page</a>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {links.map((link) => (
              <ARLinkCard
                key={link.id}
                link={link}
                onDelete={() => setConfirmDelete(link)}
                onToggleActive={handleToggleActive}
                toggling={togglingId === link.id}
                deleting={deletingId === link.id}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete AR link"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="text-gray-900 font-medium">
              &quot;{confirmDelete?.title ?? confirmDelete?.slug}&quot;
            </span>?
            This action cannot be undone and the QR code will stop working.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              loading={deletingId === confirmDelete?.id}
              className="flex-1"
            >
              Delete link
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
