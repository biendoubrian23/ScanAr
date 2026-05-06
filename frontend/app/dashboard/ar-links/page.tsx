'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Download,
  Trash2,
  ExternalLink,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ActionsMenu } from '@/components/dashboard/ActionsMenu';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { useArLinks } from '@/lib/stores/arLinksStore';
import { useModels } from '@/lib/stores/modelsStore';
import { cn, formatDate } from '@/lib/utils';
import type { ARLink } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function ARLinksPage() {
  const router = useRouter();
  const { models } = useModels();
  const { links, loading, refresh } = useArLinks();

  const [generateOpen, setGenerateOpen]   = useState(false);
  const [generatingId, setGeneratingId]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ARLink | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [qrModal, setQrModal]             = useState<ARLink | null>(null);
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Models eligible to receive a new AR link ─────────────────────────────
  const linkedModelIds = useMemo(() => new Set(links.map((l) => l.model_id)), [links]);
  const eligibleModels = useMemo(
    () => models.filter((m) => m.status === 'completed' && !linkedModelIds.has(m.id)),
    [models, linkedModelIds],
  );

  const modelById = (id: string) => models.find((m) => m.id === id);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleGenerate = async (modelId: string) => {
    setGeneratingId(modelId);
    try {
      const res = await fetch('/api/ar-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Création impossible.');
      } else {
        await refresh();
        showToast('success', 'Lien AR créé.');
        setGenerateOpen(false);
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/ar-links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        showToast('success', 'Lien AR supprimé.');
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Suppression impossible.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadQr = (link: ARLink) => {
    if (!link.qr_url) return;
    const a = document.createElement('a');
    a.href = link.qr_url;
    a.download = `qr-${link.slug}.png`;
    a.click();
  };

  return (
    <DashboardShell
      title="Liens AR"
      subtitle="Générez et gérez les QR codes pour vos expériences AR."
      action={
        <button
          type="button"
          onClick={() => setGenerateOpen(true)}
          disabled={eligibleModels.length === 0}
          className={cn(
            'inline-flex items-center gap-2 h-10 px-5 rounded-full',
            'bg-brand-500 text-white text-sm font-medium shadow-[0_4px_14px_rgba(13,148,136,0.35)]',
            'hover:bg-brand-600 hover:shadow-[0_6px_20px_rgba(13,148,136,0.4)] active:bg-brand-700 transition-all',
            eligibleModels.length === 0 && 'opacity-50 cursor-not-allowed pointer-events-none',
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Générer un lien AR</span>
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

      <div>
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-brand-50">
                <QrCode className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun lien AR pour le moment</h3>
              <p className="text-sm text-gray-500 max-w-xs mb-6">
                {eligibleModels.length === 0
                  ? 'Vous devez d\'abord avoir un modèle 3D terminé pour générer un lien AR.'
                  : 'Générez votre premier QR code pour partager une expérience AR.'}
              </p>
              {eligibleModels.length > 0 && (
                <Button onClick={() => setGenerateOpen(true)} size="lg">
                  <Plus className="w-4 h-4" /> Générer un lien AR
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base table-fixed">
                {/* Equal-width columns so the inter-column gaps stay identical
                    regardless of cell content. The Modèle column gets a bit
                    more room because of the thumbnail. */}
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr className="text-sm text-gray-500 border-b border-white/30">
                    <th className="text-left font-normal px-5 py-4">Modèle</th>
                    <th className="text-left font-normal px-5 py-4">QR Code</th>
                    <th className="text-left font-normal px-5 py-4">Scans</th>
                    <th className="text-left font-normal px-5 py-4 hidden md:table-cell">Créé</th>
                    <th className="text-right font-normal px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const model = modelById(link.model_id);
                    return (
                      <tr key={link.id} className="border-b border-white/30/40 last:border-b-0 hover:bg-white/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                              {model?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={model.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {link.title ?? model?.name ?? link.slug}
                              </p>
                              <p className="text-xs text-gray-400 font-mono truncate">/{link.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setQrModal(link)}
                            className={cn(
                              'w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 p-1 hover:border-brand-400/40 hover:shadow-[0_4px_12px_rgba(13,148,136,0.12)] transition-all',
                              !link.is_active && 'opacity-50 grayscale',
                            )}
                          >
                            {link.qr_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={link.qr_url} alt="QR" className="w-full h-full object-contain" />
                            ) : (
                              <QrCode className="w-full h-full text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-base text-gray-700">
                            <BarChart2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium tabular-nums">{link.scan_count}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-base text-gray-600 hidden md:table-cell">
                          {formatDate(link.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <ActionsMenu
                              ariaLabel={`Actions pour ${link.title ?? link.slug}`}
                              items={[
                                {
                                  label: 'Copier le lien',
                                  icon: <Copy className="w-4 h-4" />,
                                  onClick: async () => {
                                    try {
                                      await navigator.clipboard.writeText(`${APP_URL}/ar/${link.slug}`);
                                      showToast('success', 'Lien copié dans le presse-papier.');
                                    } catch {
                                      showToast('error', 'Impossible de copier le lien.');
                                    }
                                  },
                                },
                                {
                                  label: 'Télécharger le QR',
                                  icon: <Download className="w-4 h-4" />,
                                  onClick: () => handleDownloadQr(link),
                                  disabled: !link.qr_url,
                                },
                                {
                                  label: 'Voir le modèle',
                                  icon: <Eye className="w-4 h-4" />,
                                  onClick: () => router.push(`/dashboard/models/${link.model_id}`),
                                },
                                {
                                  label: 'Ouvrir l’AR',
                                  icon: <ExternalLink className="w-4 h-4" />,
                                  onClick: () => window.open(`${APP_URL}/ar/${link.slug}`, '_blank'),
                                },
                                {
                                  label: deletingId === link.id ? 'Suppression…' : 'Supprimer',
                                  icon: <Trash2 className="w-4 h-4" />,
                                  onClick: () => setConfirmDelete(link),
                                  variant: 'danger',
                                  disabled: deletingId === link.id,
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* QR modal */}
      {qrModal && (
        <QRCodeModal
          isOpen
          onClose={() => setQrModal(null)}
          title={qrModal.title ?? modelById(qrModal.model_id)?.name ?? qrModal.slug}
          slug={qrModal.slug}
          qrUrl={qrModal.qr_url}
          isActive={qrModal.is_active}
        />
      )}

      {/* Generate AR link modal */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Générer un nouveau lien AR"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Sélectionnez un modèle terminé pour lequel vous souhaitez créer un QR code AR.
          </p>
          {eligibleModels.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Aucun modèle disponible — soit vos modèles ont déjà un lien AR, soit ils ne sont pas encore terminés.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto -mx-2">
              {eligibleModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleGenerate(m.id)}
                  disabled={generatingId !== null}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-colors',
                    generatingId === m.id
                      ? 'bg-brand-50'
                      : 'hover:bg-white/60',
                    generatingId !== null && generatingId !== m.id && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {m.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
                  </div>
                  {generatingId === m.id && (
                    <span className="text-xs text-brand-600 font-medium shrink-0">Création…</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer ce lien AR"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer le lien{' '}
            <span className="text-gray-900 font-medium">
              « {confirmDelete?.title ?? confirmDelete?.slug} »
            </span> ?
            Cette action est définitive et le QR code cessera de fonctionner.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Annuler</Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              loading={deletingId === confirmDelete?.id}
              className="flex-1"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
