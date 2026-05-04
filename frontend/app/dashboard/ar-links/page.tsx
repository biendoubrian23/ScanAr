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

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
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
        checked ? 'bg-brand-600' : 'bg-white/15',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ─── AR Link Card ─────────────────────────────────────────────────────────────

interface ARLinkCardProps {
  link: ARLink;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  toggling: boolean;
  deleting: boolean;
}

function ARLinkCard({ link, onDelete, onToggleActive, toggling, deleting }: ARLinkCardProps) {
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
    <div
      className={cn(
        'glass rounded-2xl overflow-hidden transition-shadow duration-200',
        'hover:shadow-lg hover:shadow-black/30',
        !link.is_active && 'opacity-70',
      )}
    >
      {/* QR code header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/6">
        <div className="flex items-center gap-3 min-w-0">
          {link.qr_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-1 shrink-0">
              <img src={link.qr_url} alt="QR code" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-zinc-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {link.title ?? link.slug}
            </p>
            <p className="text-xs text-zinc-600 font-mono truncate">/{link.slug}</p>
          </div>
        </div>

        <Toggle
          checked={link.is_active}
          onChange={(v) => onToggleActive(link.id, v)}
          disabled={toggling}
          label={link.is_active ? 'Deactivate link' : 'Activate link'}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="tabular-nums font-medium text-zinc-200">
            {link.scan_count}
          </span>
          <span className="text-xs text-zinc-600">scans</span>
        </div>

        <Badge variant={link.is_active ? 'success' : 'default'}>
          {link.is_active ? 'Active' : 'Inactive'}
        </Badge>

        <span className="ml-auto text-xs text-zinc-600">
          {formatDate(link.created_at)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-5 pb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'flex-1',
            copied && 'border-green-500/30 text-green-400',
          )}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy link
            </>
          )}
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
          className={cn(
            'inline-flex items-center justify-center',
            'h-8 w-8 rounded-lg',
            'text-zinc-500 hover:text-zinc-200',
            'hover:bg-white/8 transition-colors duration-150',
          )}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(link.id)}
          loading={deleting}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="Delete AR link"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── AR Links Page ────────────────────────────────────────────────────────────

export default function ARLinksPage() {
  const [links, setLinks]       = useState<ARLink[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ARLink | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    // Optimistic update
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_active: active } : l)),
    );
    try {
      const res = await fetch(`/api/ar-links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      });
      if (!res.ok) {
        // Revert on failure
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_active: !active } : l)),
        );
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
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-2xl shadow-black/40 backdrop-blur-xl border',
            toast.type === 'success'
              ? 'bg-green-500/15 border-green-500/30 text-green-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300',
          )}
        >
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      <div className="space-y-6 max-w-5xl">
        {/* ── Quick stats ──────────────────────────────────────────────────── */}
        {!loading && links.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total links', value: links.length, icon: <Link2 className="w-4 h-4 text-brand-300" />, color: 'bg-brand-600/15' },
              { label: 'Active links', value: activeCount, icon: <CheckCircle2 className="w-4 h-4 text-green-300" />, color: 'bg-green-500/15' },
              { label: 'Total scans', value: totalScans, icon: <BarChart2 className="w-4 h-4 text-blue-300" />, color: 'bg-blue-500/15' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', stat.color)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-2xl animate-pulse">
                <div className="h-16 border-b border-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
                  <div className="h-8 bg-white/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={fetchLinks} className="ml-auto text-red-400">
              Retry
            </Button>
          </div>
        ) : links.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl mb-6 bg-gradient-to-br from-brand-600/20 to-brand-500/10 border border-brand-500/20">
              <QrCode className="w-9 h-9 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">No AR links yet</h3>
            <p className="text-sm text-zinc-500 max-w-xs mb-8">
              Create your first AR link from a completed 3D model on the{' '}
              <a href="/dashboard/models" className="text-brand-400 hover:text-brand-300">
                Models page
              </a>
              .
            </p>
          </div>
        ) : (
          /* ── Links grid ───────────────────────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

      {/* ── Confirm delete modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete AR link"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Are you sure you want to delete{' '}
            <span className="text-zinc-200 font-medium">
              &quot;{confirmDelete?.title ?? confirmDelete?.slug}&quot;
            </span>
            ? This action cannot be undone and the QR code will stop working.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              className="flex-1"
            >
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
