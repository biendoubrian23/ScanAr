'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Plus,
  ExternalLink,
  Copy,
  QrCode,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  AlertCircle,
  Layout,
  ArrowRight,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/dashboard/ActionsMenu';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { useCatalogues } from '@/lib/stores/cataloguesStore';
import { cn, formatDate } from '@/lib/utils';
import type {
  Catalogue,
  CatalogueLayout,
  CatalogueTheme,
} from '@/lib/types';
import { CATALOGUE_THEME_LABELS } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const THEME_SWATCH: Record<CatalogueTheme, string> = {
  pink:    'bg-gradient-to-br from-pink-200 via-fuchsia-200 to-purple-200',
  beige:   'bg-gradient-to-br from-stone-100 via-amber-100 to-orange-100',
  indigo:  'bg-gradient-to-br from-indigo-200 via-blue-200 to-purple-200',
  dark:    'bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900',
  minimal: 'bg-gradient-to-br from-gray-100 via-white to-gray-50',
};

export default function CataloguesPage() {
  const router = useRouter();
  const { catalogues, loading, refresh } = useCatalogues();

  const [createOpen, setCreateOpen]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Catalogue | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [qrModal, setQrModal]             = useState<Catalogue | null>(null);
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/catalogues/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Suppression impossible.');
      } else {
        await refresh();
        showToast('success', 'Catalogue supprimé.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const copyPublicLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${APP_URL}/c/${slug}`);
      showToast('success', 'Lien copié dans le presse-papier.');
    } catch {
      showToast('error', 'Impossible de copier le lien.');
    }
  };

  return (
    <DashboardShell
      title="Mes catalogues"
      subtitle="Regroupez vos modèles 3D en pages publiques partageables."
      action={
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className={cn(
            'inline-flex items-center gap-2 h-10 px-5 rounded-full',
            'bg-brand-500 text-white text-sm font-medium shadow-[0_4px_14px_rgba(13,148,136,0.35)]',
            'hover:bg-brand-600 hover:shadow-[0_6px_20px_rgba(13,148,136,0.4)] active:bg-brand-700 transition-all',
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau catalogue</span>
        </button>
      }
    >
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
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 sm:h-44 bg-white/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : catalogues.length === 0 ? (
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-brand-50">
            <LayoutGrid className="w-7 h-7 text-brand-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Aucun catalogue pour le moment
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Créez votre premier catalogue pour rassembler vos modèles 3D dans
            une page publique partageable.
          </p>
          <Button onClick={() => setCreateOpen(true)} size="lg">
            <Plus className="w-4 h-4" /> Nouveau catalogue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {catalogues.map((c) => (
            <CatalogueCard
              key={c.id}
              catalogue={c}
              onEdit={() => router.push(`/dashboard/catalogues/${c.id}/edit`)}
              onPreview={() => window.open(`/c/${c.slug}`, '_blank', 'noopener,noreferrer')}
              onCopyLink={() => copyPublicLink(c.slug)}
              onShowQR={() => setQrModal(c)}
              onDelete={() => setConfirmDelete(c)}
              deleting={deletingId === c.id}
            />
          ))}
        </div>
      )}

      <CreateCatalogueModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (newCat) => {
          setCreateOpen(false);
          await refresh();
          router.push(`/dashboard/catalogues/${newCat.id}/edit`);
        }}
        onError={(msg) => showToast('error', msg)}
      />

      {/* QR modal — shared component, fed with catalogue's public URL */}
      <QRCodeModal
        isOpen={!!qrModal}
        onClose={() => setQrModal(null)}
        title={qrModal?.title ?? ''}
        slug={qrModal?.slug ?? ''}
        qrUrl={qrModal?.qr_url ?? null}
        isActive={!!qrModal && qrModal.is_active && qrModal.is_public}
        publicUrl={qrModal ? `${APP_URL}/c/${qrModal.slug}` : undefined}
        inactiveLabel="Ce catalogue est désactivé. Réactivez-le pour le rendre accessible publiquement."
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer ce catalogue ?"
        size="sm"
      >
        {confirmDelete && (
          <div>
            <p className="text-sm text-gray-600 mb-5">
              Cette action est irréversible. Le lien public, le QR code et toutes les
              entrées du catalogue seront définitivement supprimés. Les modèles 3D sous-jacents
              ne sont pas affectés.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.id)}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}

// ─── Catalogue card ───────────────────────────────────────────────────────────
function CatalogueCard({
  catalogue,
  onEdit,
  onPreview,
  onCopyLink,
  onShowQR,
  onDelete,
  deleting,
}: {
  catalogue: Catalogue;
  onEdit:    () => void;
  onPreview: () => void;
  onCopyLink:() => void;
  onShowQR:  () => void;
  onDelete:  () => void;
  deleting:  boolean;
}) {
  const layoutLabel: Record<CatalogueLayout, string> = {
    vertical:   'Linktree',
    horizontal: 'Carousel',
  };
  const isOnline = catalogue.is_active && catalogue.is_public;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white/30 backdrop-blur-xl border border-white/50',
        'shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]',
        /* mobile: horizontal row — desktop: vertical column */
        'flex flex-row sm:flex-col',
        'hover:bg-white/45 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all',
        deleting && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Theme swatch — narrow left strip on mobile, full banner on desktop */}
      <button
        type="button"
        onClick={onEdit}
        aria-label="Modifier le catalogue"
        className={cn(
          'relative shrink-0 overflow-hidden',
          /* mobile: fixed-width strip, stretches to row height */
          'w-20 self-stretch',
          /* desktop: full width with 2:1 banner */
          'sm:w-full sm:self-auto sm:aspect-[2/1]',
          !catalogue.cover_url && !catalogue.avatar_url && THEME_SWATCH[catalogue.theme],
        )}
      >
        {/* Cover banner — cover_url takes priority, then avatar_url as fallback */}
        {(catalogue.cover_url || catalogue.avatar_url) && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={catalogue.cover_url ?? catalogue.avatar_url!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Avatar badge — only shown when a different cover image is set */}
        {catalogue.cover_url && catalogue.avatar_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur ring-1 ring-white/60 shadow-sm flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={catalogue.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        {!catalogue.cover_url && !catalogue.avatar_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/80 backdrop-blur ring-1 ring-white/60 shadow-sm flex items-center justify-center overflow-hidden">
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Badges — desktop only */}
        <div className="absolute top-2 left-2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-medium text-gray-700 border border-white/60">
          <Layout className="w-2.5 h-2.5" />
          {layoutLabel[catalogue.layout]}
        </div>
        <div className="absolute top-2 right-2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-medium text-gray-700 border border-white/60">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isOnline ? 'bg-emerald-500' : 'bg-gray-400')} />
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col gap-1">
        {/* Mobile only: layout type + status */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 sm:hidden">
          <Layout className="w-2.5 h-2.5 shrink-0" />
          <span>{layoutLabel[catalogue.layout]}</span>
          <span className="ml-auto flex items-center gap-1 shrink-0">
            <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-gray-400')} />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>

        {/* Title + actions */}
        <div className="flex items-center gap-1">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate flex-1">
            {catalogue.title}
          </h3>
          <ActionsMenu
            ariaLabel={`Actions pour ${catalogue.title}`}
            items={[
              { label: 'Modifier', icon: <Pencil className="w-4 h-4" />, onClick: onEdit },
              { label: 'Voir la page publique', icon: <ExternalLink className="w-4 h-4" />, onClick: onPreview },
              { label: 'Copier le lien', icon: <Copy className="w-4 h-4" />, onClick: onCopyLink },
              { label: 'QR Code', icon: <QrCode className="w-4 h-4" />, onClick: onShowQR },
              { label: 'Supprimer', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, variant: 'danger' },
            ]}
          />
        </div>

        {/* Subtitle — desktop only */}
        {catalogue.subtitle && (
          <p className="text-[10px] text-gray-500 truncate hidden sm:block">{catalogue.subtitle}</p>
        )}

        {/* Slug + views */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="font-mono truncate">/c/{catalogue.slug}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Eye className="w-2.5 h-2.5" />
            <span className="tabular-nums">{catalogue.view_count}</span>
          </span>
          <span className="ml-auto shrink-0 hidden sm:inline">{formatDate(catalogue.created_at)}</span>
        </div>

        {/* Edit button — desktop only */}
        <button
          type="button"
          onClick={onEdit}
          className="hidden sm:inline-flex mt-auto items-center justify-center gap-1 h-7 w-full rounded-full bg-white/30 backdrop-blur-md border border-white/60 text-gray-700 text-xs font-medium hover:bg-white/45 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]"
        >
          Modifier <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Create-catalogue modal ───────────────────────────────────────────────────
function CreateCatalogueModal({
  isOpen,
  onClose,
  onCreated,
  onError,
}: {
  isOpen:    boolean;
  onClose:   () => void;
  onCreated: (cat: Catalogue) => void;
  onError:   (msg: string) => void;
}) {
  const [title, setTitle]       = useState('');
  const [layout, setLayout]     = useState<CatalogueLayout>('vertical');
  const [theme, setTheme]       = useState<CatalogueTheme>('minimal');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setLayout('vertical');
    setTheme('minimal');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/catalogues', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: trimmed, layout, theme }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        onError(body.error ?? 'Création impossible.');
        setSubmitting(false);
        return;
      }
      reset();
      onCreated(body.data as Catalogue);
    } catch {
      onError('Erreur réseau. Réessayez.');
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau catalogue" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="cat-title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom du catalogue
          </label>
          <input
            id="cat-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nordic Atelier, AR Gastronomy…"
            maxLength={80}
            required
            autoFocus
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        {/* Layout — fixed at creation per spec */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mise en page
          </label>
          <p className="text-xs text-gray-500 mb-2.5">
            Le format ne peut pas être changé après la création.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <LayoutOption
              active={layout === 'vertical'}
              onClick={() => setLayout('vertical')}
              title="Linktree"
              desc="Profil + liste verticale"
            />
            <LayoutOption
              active={layout === 'horizontal'}
              onClick={() => setLayout('horizontal')}
              title="Carousel"
              desc="Cartes glissables côte à côte"
              hint="Idéal pour la restauration"
            />
          </div>
        </div>

        {/* Theme picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thème
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(['minimal', 'pink', 'beige', 'indigo', 'dark'] as CatalogueTheme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  'relative aspect-square rounded-xl border-2 overflow-hidden transition-all',
                  theme === t ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-transparent hover:border-gray-300',
                )}
                aria-label={CATALOGUE_THEME_LABELS[t]}
              >
                <div className={cn('w-full h-full', THEME_SWATCH[t])} />
                {theme === t && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">{CATALOGUE_THEME_LABELS[theme]}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={!title.trim() || submitting}>
            {submitting ? 'Création…' : 'Créer le catalogue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function LayoutOption({
  active, onClick, title, desc, hint,
}: {
  active: boolean; onClick: () => void; title: string; desc: string; hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all',
        active
          ? 'border-brand-500 bg-brand-50/40'
          : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Layout className="w-4 h-4 text-brand-600" />
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>
      <span className="text-xs text-gray-500">{desc}</span>
      {hint && (
        <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium">
          <span aria-hidden="true">🍽</span>
          {hint}
        </span>
      )}
    </button>
  );
}

