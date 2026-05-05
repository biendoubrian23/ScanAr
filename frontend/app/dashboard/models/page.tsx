'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Search,
  Filter as FilterIcon,
  AlertCircle,
  CheckCircle2,
  QrCode as QrCodeIcon,
  Eye,
  Pencil,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { ActionsMenu } from '@/components/dashboard/ActionsMenu';
import { UploadDropdownButton } from '@/components/dashboard/UploadDropdownButton';
import { UploadModal } from '@/components/dashboard/UploadModal';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { useModels } from '@/lib/stores/modelsStore';
import { useArLinks } from '@/lib/stores/arLinksStore';
import {
  cn,
  formatBytes,
  formatDate,
} from '@/lib/utils';
import {
  OBJECT_TYPE_LABELS,
  type ARLink,
  type Model3D,
  type ObjectType,
} from '@/lib/types';

const PAGE_SIZE = 8;

const TYPE_FILTERS: ('all' | ObjectType)[] = [
  'all', 'object', 'furniture', 'clothing', 'vehicle', 'building', 'character', 'other',
];

export default function ModelsPage() {
  const router = useRouter();
  const { models, loading, refresh } = useModels();
  const { links, patchLink } = useArLinks();

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ObjectType>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage]             = useState(1);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [qrModal, setQrModal]       = useState<{ link: ARLink; model: Model3D } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Model3D | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Filter / paginate ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = models;
    if (typeFilter !== 'all') list = list.filter((m) => (m.object_type ?? 'object') === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [models, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const linkByModel = (id: string) => links.find((l) => l.model_id === id);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleToggleAr = async (model: Model3D, current: ARLink | undefined, next: boolean) => {
    if (model.status !== 'completed') return;

    if (current) {
      patchLink(current.id, { is_active: next });
      const res = await fetch(`/api/ar-links/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        patchLink(current.id, { is_active: !next });
        showToast('error', 'Impossible de mettre à jour le lien AR.');
      }
      return;
    }

    if (next) {
      const res = await fetch('/api/ar-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Impossible de créer le lien AR.');
      } else {
        showToast('success', 'Lien AR créé.');
      }
    }
  };

  const handleDelete = async (model: Model3D) => {
    setConfirmDelete(null);
    setDeletingId(model.id);
    try {
      const res = await fetch(`/api/models/${model.id}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        showToast('success', `« ${model.name} » supprimé.`);
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Impossible de supprimer ce modèle.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (model: Model3D) => {
    if (!model.glb_url) {
      showToast('error', 'Le fichier GLB n’est pas encore disponible.');
      return;
    }
    const a = document.createElement('a');
    a.href = model.glb_url;
    a.download = `${model.name.replace(/\s+/g, '_')}.glb`;
    a.click();
  };

  return (
    <DashboardShell
      title="Mes modèles"
      subtitle="Gérez et organisez tous vos modèles 3D."
      action={<UploadDropdownButton onSelectImage={() => setUploadOpen(true)} />}
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

      <div className="space-y-4">

        {/* Search + filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Rechercher un modèle…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <FilterIcon className="w-4 h-4" />
              Filtrer
              {typeFilter !== 'all' && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand-600 text-white text-[10px] font-semibold px-1.5">
                  1
                </span>
              )}
            </Button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-2">
                <p className="text-xs font-medium text-gray-500 px-2 py-1.5">Type d'objet</p>
                <div className="space-y-0.5">
                  {TYPE_FILTERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTypeFilter(t); setPage(1); setFilterOpen(false); }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                        typeFilter === t
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {t === 'all' ? 'Tous les types' : OBJECT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onUpload={() => setUploadOpen(true)} hasFilter={typeFilter !== 'all' || !!search.trim()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed sm:table-auto">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left font-normal px-3 sm:px-5 py-3">Modèle</th>
                    <th className="text-left font-normal px-2 sm:px-3 py-3 w-[40px] sm:w-auto">Statut</th>
                    <th className="text-left font-normal px-3 py-3 hidden md:table-cell">Type</th>
                    <th className="text-left font-normal px-3 py-3 hidden lg:table-cell">Créé</th>
                    <th className="text-left font-normal px-3 py-3 hidden lg:table-cell">Taille</th>
                    <th className="text-left font-normal px-2 sm:px-3 py-3 w-[56px] sm:w-auto">AR</th>
                    <th className="text-left font-normal px-2 sm:px-3 py-3 w-[40px] sm:w-auto"><span className="hidden sm:inline">QR Code</span><span className="sm:hidden">QR</span></th>
                    <th className="text-right font-normal px-2 sm:px-5 py-3 w-[40px] sm:w-auto"><span className="hidden sm:inline">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((model) => {
                    const link = linkByModel(model.id);
                    const isCompleted = model.status === 'completed';
                    return (
                      <tr
                        key={model.id}
                        onClick={() => router.push(`/dashboard/models/${model.id}`)}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/70 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-5 py-3 max-w-[140px] sm:max-w-none">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                              {model.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={model.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{model.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{formatDate(model.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3"><Badge status={model.status} compact /></td>
                        <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                          {OBJECT_TYPE_LABELS[model.object_type ?? 'object']}
                        </td>
                        <td className="px-3 py-3 text-gray-500 hidden lg:table-cell">
                          {formatDate(model.created_at)}
                        </td>
                        <td className="px-3 py-3 text-gray-500 hidden lg:table-cell">
                          {model.file_size_bytes ? formatBytes(model.file_size_bytes) : '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-3">
                          <Toggle
                            checked={Boolean(link?.is_active)}
                            disabled={!isCompleted}
                            onChange={(v) => handleToggleAr(model, link, v)}
                            label={link?.is_active ? 'Désactiver AR' : 'Activer AR'}
                          />
                        </td>
                        <td className="px-2 sm:px-3 py-3">
                          <button
                            type="button"
                            disabled={!link}
                            title={link ? 'Voir le QR code' : 'Aucun lien AR'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (link) setQrModal({ link, model });
                            }}
                            className={cn(
                              'inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                              link
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-300 cursor-not-allowed',
                            )}
                          >
                            <QrCodeIcon className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-2 sm:px-5 py-3 text-right">
                          <ActionsMenu
                            ariaLabel={`Actions pour ${model.name}`}
                            items={[
                              {
                                label: 'Voir',
                                icon: <Eye className="w-4 h-4" />,
                                onClick: () => router.push(`/dashboard/models/${model.id}`),
                              },
                              {
                                label: 'Éditer',
                                icon: <Pencil className="w-4 h-4" />,
                                onClick: () => router.push(`/dashboard/models/${model.id}/edit`),
                              },
                              {
                                label: 'Télécharger',
                                icon: <Download className="w-4 h-4" />,
                                onClick: () => handleDownload(model),
                                disabled: !model.glb_url,
                              },
                              {
                                label: deletingId === model.id ? 'Suppression…' : 'Supprimer',
                                icon: <Trash2 className="w-4 h-4" />,
                                onClick: () => setConfirmDelete(model),
                                variant: 'danger',
                                disabled: deletingId === model.id,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Affichage {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length} résultats
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Page précédente"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      'inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs',
                      safePage === n
                        ? 'border border-brand-600 text-brand-600 font-medium'
                        : 'text-gray-500 hover:bg-gray-100',
                    )}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-gray-400 px-1 text-xs">…</span>}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Page suivante"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />

      {qrModal && (
        <QRCodeModal
          isOpen
          onClose={() => setQrModal(null)}
          title={qrModal.model.name}
          slug={qrModal.link.slug}
          qrUrl={qrModal.link.qr_url}
          isActive={qrModal.link.is_active}
        />
      )}

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer ce modèle"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer{' '}
            <span className="text-gray-900 font-medium">« {confirmDelete?.name} »</span> ?
            Cette action est définitive et le QR code associé cessera de fonctionner.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Annuler</Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
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

function EmptyState({ onUpload, hasFilter }: { onUpload: () => void; hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-brand-50">
        <Box className="w-7 h-7 text-brand-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {hasFilter ? 'Aucun résultat' : 'Aucun modèle 3D pour le moment'}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {hasFilter
          ? 'Aucun modèle ne correspond à votre recherche ou aux filtres sélectionnés.'
          : "Importez une photo produit et notre IA générera un modèle 3D photoréaliste en quelques minutes."}
      </p>
      {!hasFilter && (
        <Button onClick={onUpload} size="lg">
          Importer votre première image
        </Button>
      )}
    </div>
  );
}
