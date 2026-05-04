'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Pencil,
  Share2,
  MoreHorizontal,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Box,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { ActionsMenu } from '@/components/dashboard/ActionsMenu';
import { Model3DPreview } from '@/components/dashboard/Model3DPreview';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { useModels } from '@/lib/stores/modelsStore';
import { useArLinks } from '@/lib/stores/arLinksStore';
import {
  cn,
  formatBytes,
  formatDateShort,
} from '@/lib/utils';
import { OBJECT_TYPE_LABELS, type ARLink, type Model3D } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function ModelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const modelId = params.id;

  const { models, loading: modelsLoading, refresh } = useModels();
  const { links, patchLink } = useArLinks();

  const model = useMemo(() => models.find((m) => m.id === modelId), [models, modelId]);
  const link  = useMemo(() => links.find((l) => l.model_id === modelId), [links, modelId]);

  const [qrOpen, setQrOpen]                 = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [shared, setShared]                 = useState(false);
  const [toast, setToast]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Loading / 404 ─────────────────────────────────────────────────────────
  if (!modelsLoading && !model) {
    return (
      <DashboardShell title="Modèle introuvable" subtitle="Ce modèle n'existe pas ou a été supprimé.">
        <Link href="/dashboard/models" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Retour aux modèles
        </Link>
      </DashboardShell>
    );
  }

  if (!model) {
    return (
      <DashboardShell title="Chargement…">
        <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
      </DashboardShell>
    );
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleToggleAr = async (next: boolean) => {
    if (model.status !== 'completed') return;
    if (link) {
      patchLink(link.id, { is_active: next });
      const res = await fetch(`/api/ar-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        patchLink(link.id, { is_active: !next });
        showToast('error', 'Échec de mise à jour.');
      }
      return;
    }
    if (next) {
      const res = await fetch('/api/ar-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id }),
      });
      if (!res.ok) showToast('error', 'Impossible de créer le lien AR.');
      else showToast('success', 'Lien AR créé.');
    }
  };

  const handleShare = async () => {
    if (!link) {
      showToast('error', 'Activez l’expérience AR pour générer un lien partageable.');
      return;
    }
    const url = `${APP_URL}/ar/${link.slug}`;
    const shareData = { title: `${model.name} — Expérience AR`, url };
    if (typeof navigator.share === 'function') {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
      return;
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  const handleDownload = () => {
    if (!model.glb_url) return;
    const a = document.createElement('a');
    a.href = model.glb_url;
    a.download = `${model.name.replace(/\s+/g, '_')}.glb`;
    a.click();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/models/${model.id}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        router.push('/dashboard/models');
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Suppression impossible.');
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  };

  // ── Detail rows ───────────────────────────────────────────────────────────
  const dimsLabel = model.dimensions_mm
    ? `${model.dimensions_mm.x} × ${model.dimensions_mm.y} × ${model.dimensions_mm.z} mm`
    : '—';

  const details: Array<[string, string]> = [
    ['Créé',         formatDateShort(model.created_at, true)],
    ['Taille',       model.file_size_bytes ? formatBytes(model.file_size_bytes) : '—'],
    ['Polygones',    model.polygons ? `${(model.polygons / 1000).toFixed(1)}k` : '—'],
    ['Matériaux',    model.materials_count?.toString() ?? '—'],
    ['Format',       model.format ?? 'glTF'],
    ['Dimensions',   dimsLabel],
  ];

  return (
    <DashboardShell
      title={model.name}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            href={`/dashboard/models/${model.id}/edit`}
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Éditer</span>
          </Button>
          <Button variant="primary" size="md" onClick={handleShare}>
            {shared ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Partager</span>
              </>
            )}
          </Button>
          <ActionsMenu
            ariaLabel="Plus d'actions"
            items={[
              {
                label: 'Télécharger GLB',
                icon: <Download className="w-4 h-4" />,
                onClick: handleDownload,
                disabled: !model.glb_url,
              },
              {
                label: 'Ouvrir l’expérience AR',
                icon: <ExternalLink className="w-4 h-4" />,
                onClick: () => link && window.open(`${APP_URL}/ar/${link.slug}`, '_blank'),
                disabled: !link,
              },
              {
                label: 'Supprimer',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: () => setConfirmDelete(true),
                variant: 'danger',
              },
            ]}
          />
        </div>
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link href="/dashboard/models" className="hover:text-gray-900 transition-colors">Mes modèles</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 truncate">{model.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Preview — portrait viewer */}
        <div>
          <Model3DPreview
            glbUrl={model.glb_url}
            usdzUrl={model.usdz_url}
            imageUrl={model.image_url}
            alt={model.name}
          />
        </div>

        {/* Details panel */}
        <aside className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 self-start">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status={model.status} />
            <Badge variant="default">{OBJECT_TYPE_LABELS[model.object_type ?? 'object']}</Badge>
          </div>

          <section>
            <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-3">Détails</h3>
            <dl className="space-y-2.5">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-gray-500 shrink-0">{label}</dt>
                  <dd className="text-gray-900 text-right tabular-nums">{value}</dd>
                </div>
              ))}
              {model.description && (
                <div className="pt-2 border-t border-gray-100">
                  <dt className="text-gray-500 text-sm mb-1">Description</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">{model.description}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Expérience AR</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {link?.is_active
                    ? `${link.scan_count} scan${link.scan_count !== 1 ? 's' : ''} enregistré${link.scan_count !== 1 ? 's' : ''}`
                    : 'Désactivée'}
                </p>
              </div>
              <Toggle
                checked={Boolean(link?.is_active)}
                disabled={model.status !== 'completed'}
                onChange={handleToggleAr}
                label={link?.is_active ? 'Désactiver AR' : 'Activer AR'}
              />
            </div>
          </section>

          {link && (
            <section className="border-t border-gray-100 pt-4">
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-3">QR Code</h3>
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className={cn(
                    'w-24 h-24 rounded-xl bg-white border border-gray-200 p-2 shrink-0 hover:border-brand-500 transition-colors',
                    !link.is_active && 'opacity-50 grayscale',
                  )}
                >
                  {link.qr_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.qr_url} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <Box className="w-full h-full text-gray-300" />
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)} className="w-full justify-start">
                    <Download className="w-3.5 h-3.5" />
                    Télécharger / Partager
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    href={`${APP_URL}/ar/${link.slug}`}
                    className="w-full justify-start"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Voir en AR
                  </Button>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>

      {link && (
        <QRCodeModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          title={model.name}
          slug={link.slug}
          qrUrl={link.qr_url}
          isActive={link.is_active}
        />
      )}

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce modèle"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer <span className="text-gray-900 font-medium">« {model.name} »</span> ?
            Cette action est définitive et le QR code associé cessera de fonctionner.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Annuler</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Supprimer</Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
