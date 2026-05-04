'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Link2,
  ScanLine,
  HardDrive,
  ArrowRight,
  ArrowUpRight,
  Plus,
  QrCode as QrCodeIcon,
  BarChart3,
  FolderOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { UploadDropdownButton } from '@/components/dashboard/UploadDropdownButton';
import { UploadModal } from '@/components/dashboard/UploadModal';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { useAuth } from '@/hooks/useAuth';
import { useModels } from '@/lib/stores/modelsStore';
import { useArLinks } from '@/lib/stores/arLinksStore';
import {
  cn,
  formatDateShort,
  formatStorage,
  startOfMonth,
} from '@/lib/utils';
import { OBJECT_TYPE_LABELS, type ARLink, type Model3D, type StorageUsage } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  delta?: { sign: 'pos' | 'neg' | 'zero'; text: string };
  loading?: boolean;
  rightSlot?: React.ReactNode;
  footer?: React.ReactNode;
}

function KpiCard({ label, value, delta, loading, rightSlot, footer }: KpiCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-1 min-h-[110px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        {rightSlot}
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-tight">
          {value}
        </p>
      )}
      {footer ?? (
        delta && !loading && (
          <p
            className={cn(
              'text-xs mt-auto',
              delta.sign === 'pos'   && 'text-emerald-600',
              delta.sign === 'neg'   && 'text-red-600',
              delta.sign === 'zero'  && 'text-gray-400',
            )}
          >
            {delta.text}
          </p>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function QuickActionRow({
  href, icon, title, subtitle, onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      {inner}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { models, loading: modelsLoading } = useModels();
  const { links, loading: linksLoading, patchLink } = useArLinks();

  const [storage, setStorage]         = useState<StorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [qrModal, setQrModal]       = useState<{ link: ARLink; model: Model3D } | null>(null);

  useEffect(() => {
    fetch('/api/storage')
      .then((r) => r.json())
      .then((res) => setStorage(res.data ?? null))
      .finally(() => setStorageLoading(false));
  }, [models.length]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const monthStart   = useMemo(() => startOfMonth(), []);
  const totalScans   = useMemo(() => links.reduce((s, l) => s + l.scan_count, 0), [links]);
  const activeLinks  = useMemo(() => links.filter((l) => l.is_active).length, [links]);
  const recentModels = useMemo(() => models.slice(0, 5), [models]);

  const newModelsThisMonth = useMemo(
    () => models.filter((m) => new Date(m.created_at) >= monthStart).length,
    [models, monthStart],
  );
  const newLinksThisMonth = useMemo(
    () => links.filter((l) => new Date(l.created_at) >= monthStart).length,
    [links, monthStart],
  );

  const greetingFirstName =
    profile?.full_name?.split(' ')[0]
    ?? profile?.email?.split('@')[0]
    ?? 'créateur';

  // ── Toggle AR (creates link if missing, patches is_active otherwise) ──────
  const handleToggleAr = async (model: Model3D, current: ARLink | undefined, next: boolean) => {
    if (model.status !== 'completed') return;

    if (current) {
      patchLink(current.id, { is_active: next });
      const res = await fetch(`/api/ar-links/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) patchLink(current.id, { is_active: !next });
      return;
    }

    if (next) {
      await fetch('/api/ar-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id }),
      });
    }
  };

  const linkByModel = (modelId: string) => links.find((l) => l.model_id === modelId);

  return (
    <DashboardShell
      title={`Bon retour, ${greetingFirstName} 👋`}
      subtitle="Voici ce qui se passe avec vos modèles 3D."
      action={<UploadDropdownButton onSelectImage={() => setUploadOpen(true)} />}
    >
      <div className="space-y-5 max-w-7xl">

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total modèles"
            value={models.length}
            loading={modelsLoading}
            delta={{
              sign: newModelsThisMonth > 0 ? 'pos' : 'zero',
              text: `+${newModelsThisMonth} ce mois`,
            }}
          />

          <KpiCard
            label="Liens AR actifs"
            value={`${activeLinks} / ${links.length}`}
            loading={linksLoading}
            delta={{
              sign: newLinksThisMonth > 0 ? 'pos' : 'zero',
              text: `+${newLinksThisMonth} ce mois`,
            }}
          />

          <KpiCard
            label="Scans AR"
            value={totalScans}
            loading={linksLoading}
            delta={{ sign: 'zero', text: 'Tous modèles confondus' }}
          />

          <KpiCard
            label="Stockage"
            value={storage ? formatStorage(storage.used_mb) : '—'}
            loading={storageLoading}
            footer={
              <div className="mt-2 space-y-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (storage?.percent ?? 0) >= 90 ? 'bg-red-500' : 'bg-brand-600',
                    )}
                    style={{ width: `${storage?.percent ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  sur {storage ? formatStorage(storage.limit_mb) : '500 Mo'} utilisés
                </p>
              </div>
            }
          />
        </div>

        {/* ── Main two-col layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent models — spans 2 cols */}
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Modèles récents</h2>
              <Link
                href="/dashboard/models"
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                Voir tous les modèles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </header>

            {modelsLoading ? (
              <div className="p-5 space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            ) : recentModels.length === 0 ? (
              <EmptyModels onUpload={() => setUploadOpen(true)} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left font-normal px-5 py-3">Modèle</th>
                      <th className="text-left font-normal px-3 py-3">Statut</th>
                      <th className="text-left font-normal px-3 py-3 hidden md:table-cell">Type</th>
                      <th className="text-left font-normal px-3 py-3 hidden md:table-cell">Créé</th>
                      <th className="text-left font-normal px-3 py-3">AR</th>
                      <th className="text-left font-normal px-3 py-3">QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentModels.map((model) => {
                      const link = linkByModel(model.id);
                      const isCompleted = model.status === 'completed';
                      return (
                        <tr
                          key={model.id}
                          onClick={() => router.push(`/dashboard/models/${model.id}`)}
                          className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/70 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                                {model.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={model.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-900 font-medium truncate">{model.name}</p>
                                <p className="text-xs text-gray-400">{formatDateShort(model.created_at, true)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><Badge status={model.status} /></td>
                          <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                            {OBJECT_TYPE_LABELS[model.object_type ?? 'object']}
                          </td>
                          <td className="px-3 py-3 text-gray-500 hidden md:table-cell">
                            {formatDateShort(model.created_at)}
                          </td>
                          <td className="px-3 py-3">
                            <Toggle
                              checked={Boolean(link?.is_active)}
                              disabled={!isCompleted}
                              onChange={(v) => handleToggleAr(model, link, v)}
                              label={link?.is_active ? 'Désactiver AR' : 'Activer AR'}
                            />
                          </td>
                          <td className="px-3 py-3">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {recentModels.length > 0 && (
              <div className="text-center py-3 border-t border-gray-100">
                <Link
                  href="/dashboard/models"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700"
                >
                  Voir tous les modèles <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>

          {/* Right column: Quick actions + Storage */}
          <div className="space-y-4">
            <section className="bg-white border border-gray-200 rounded-2xl p-2">
              <h2 className="text-sm font-semibold text-gray-900 px-3 py-2">Actions rapides</h2>
              <div className="space-y-0.5">
                <QuickActionRow
                  icon={<Box className="w-4 h-4" />}
                  title="Importer un modèle 3D"
                  subtitle="Ajouter un nouveau modèle"
                  onClick={() => setUploadOpen(true)}
                />
                <QuickActionRow
                  icon={<QrCodeIcon className="w-4 h-4" />}
                  title="Générer un QR Code"
                  subtitle="Créer un QR pour une expérience AR"
                  href="/dashboard/ar-links"
                />
                <QuickActionRow
                  icon={<BarChart3 className="w-4 h-4" />}
                  title="Voir l'analytique"
                  subtitle="Suivre vos performances"
                  href="/dashboard/analytics"
                />
                <QuickActionRow
                  icon={<FolderOpen className="w-4 h-4" />}
                  title="Gérer les modèles"
                  subtitle="Organiser votre bibliothèque"
                  href="/dashboard/models"
                />
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Stockage</h2>
                <HardDrive className="w-4 h-4 text-gray-400" />
              </div>
              {storageLoading ? (
                <div className="mt-3 h-12 bg-gray-100 rounded animate-pulse" />
              ) : storage && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{formatStorage(storage.used_mb)}</span>
                    <span className="text-gray-400"> sur {formatStorage(storage.limit_mb)} utilisés</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          storage.percent >= 90 ? 'bg-red-500' : 'bg-brand-600',
                        )}
                        style={{ width: `${storage.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums shrink-0">{storage.percent}%</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1"
                  >
                    Améliorer le plan <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>
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
    </DashboardShell>
  );
}

function EmptyModels({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-3">
        <Box className="w-5 h-5 text-brand-600" />
      </div>
      <p className="text-sm font-medium text-gray-900">Aucun modèle pour le moment</p>
      <p className="text-xs text-gray-500 mt-1">Importez une image pour générer votre premier modèle 3D.</p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        <Plus className="w-3.5 h-3.5" /> Importer une image
      </button>
    </div>
  );
}
