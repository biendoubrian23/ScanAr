'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Clock,
  Link2,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useAuth } from '@/hooks/useAuth';
import { useModels } from '@/hooks/useModels';
import { useUpload } from '@/hooks/useUpload';
import { formatDate, formatBytes, cn } from '@/lib/utils';
import type { ARLink, Model3D } from '@/lib/types';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconColor: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, iconColor, loading }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl shrink-0',
          iconColor,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-7 w-16 bg-white/10 rounded-lg animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-zinc-100 tabular-nums leading-none">
            {value}
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Upload Result Banner ─────────────────────────────────────────────────────

interface UploadResultProps {
  model: Model3D;
  onDismiss: () => void;
}

function UploadResultBanner({ model, onDismiss }: UploadResultProps) {
  const isReady = model.status === 'completed';
  const isFailed = model.status === 'failed';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm',
        isReady && 'bg-green-500/10 border border-green-500/25 text-green-300',
        isFailed && 'bg-red-500/10 border border-red-500/25 text-red-300',
        !isReady && !isFailed && 'bg-blue-500/10 border border-blue-500/25 text-blue-300',
      )}
    >
      {isReady && <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {isFailed && <AlertCircle className="w-4 h-4 shrink-0" />}
      {!isReady && !isFailed && (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      )}

      <span className="flex-1">
        {isReady && (
          <>
            3D model ready!{' '}
            <Link
              href="/dashboard/models"
              className="font-medium underline underline-offset-2"
            >
              View &quot;{model.name}&quot;
            </Link>
          </>
        )}
        {isFailed && `Processing failed: ${model.error_message ?? 'Unknown error'}`}
        {!isReady && !isFailed && `Processing "${model.name}"…`}
      </span>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-current opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile } = useAuth();
  const { models, loading: modelsLoading } = useModels();
  const { upload, uploading, progress, error: uploadError } = useUpload();

  const [arLinks, setArLinks]       = useState<ARLink[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [uploadedModel, setUploadedModel] = useState<Model3D | null>(null);

  // Track the latest uploaded model through realtime updates
  useEffect(() => {
    if (!uploadedModel) return;
    const updated = models.find((m) => m.id === uploadedModel.id);
    if (updated) setUploadedModel(updated);
  }, [models, uploadedModel]);

  // Fetch AR links + analytics counts
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [linksRes, analyticsRes] = await Promise.all([
          fetch('/api/ar-links'),
          fetch('/api/analytics'),
        ]);
        if (linksRes.ok) {
          const { data } = await linksRes.json();
          setArLinks(data ?? []);
        }
        if (analyticsRes.ok) {
          const { data } = await analyticsRes.json();
          setTotalScans(data?.total_scans ?? 0);
        }
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const processingCount = models.filter(
    (m) => m.status === 'processing' || m.status === 'pending',
  ).length;

  const recentModels   = models.slice(0, 5);
  const recentArLinks  = arLinks.slice(0, 3);

  const handleFileAccepted = async (file: File) => {
    const modelName = file.name.replace(/\.[^.]+$/, '');
    const result = await upload(file, modelName);
    if (result) setUploadedModel(result);
  };

  const greeting = profile?.full_name
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : 'Welcome back';

  return (
    <DashboardShell title="Dashboard" subtitle={greeting}>
      <div className="space-y-8 max-w-6xl">

        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Models"
            value={models.length}
            icon={<Box className="w-5 h-5 text-brand-300" />}
            iconColor="bg-brand-600/20"
            loading={modelsLoading}
          />
          <StatCard
            label="Processing"
            value={processingCount}
            icon={<Clock className="w-5 h-5 text-yellow-300" />}
            iconColor="bg-yellow-500/15"
            loading={modelsLoading}
          />
          <StatCard
            label="AR Links"
            value={arLinks.length}
            icon={<Link2 className="w-5 h-5 text-blue-300" />}
            iconColor="bg-blue-500/15"
            loading={statsLoading}
          />
          <StatCard
            label="Total Scans"
            value={totalScans}
            icon={<BarChart2 className="w-5 h-5 text-green-300" />}
            iconColor="bg-green-500/15"
            loading={statsLoading}
          />
        </div>

        {/* ── Two-column grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Models */}
          <section className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-zinc-200">Recent Models</h2>
              <Link
                href="/dashboard/models"
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {modelsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <Box className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">No models yet</p>
                <p className="text-xs text-zinc-700 mt-1">Upload an image to get started</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {recentModels.map((model) => (
                  <li
                    key={model.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                      {model.image_url ? (
                        <img
                          src={model.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Box className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{model.name}</p>
                      <p className="text-xs text-zinc-600">{formatDate(model.created_at)}</p>
                    </div>

                    <Badge status={model.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Quick Upload */}
          <section className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-zinc-200">Quick Upload</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Drop an image to generate a 3D model
              </p>
            </div>

            <div className="p-5 space-y-4">
              <UploadZone
                onFileAccepted={handleFileAccepted}
                disabled={uploading}
              />

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-1.5">
                  <ProgressBar value={progress} showPercent color="brand" />
                  <p className="text-xs text-zinc-500 text-center">
                    {progress < 60
                      ? 'Uploading image…'
                      : progress < 100
                      ? 'Creating model record…'
                      : 'Queued for processing'}
                  </p>
                </div>
              )}

              {/* Upload error */}
              {uploadError && !uploading && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Success/result banner */}
              {uploadedModel && !uploading && (
                <UploadResultBanner
                  model={uploadedModel}
                  onDismiss={() => setUploadedModel(null)}
                />
              )}
            </div>
          </section>
        </div>

        {/* ── Recent AR Activity ───────────────────────────────────────────── */}
        {recentArLinks.length > 0 && (
          <section className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-zinc-200">Recent AR Activity</h2>
              <Link
                href="/dashboard/ar-links"
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {recentArLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  {link.qr_url ? (
                    <img
                      src={link.qr_url}
                      alt="QR code"
                      className="w-10 h-10 rounded-lg object-cover bg-white p-0.5 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {link.title ?? link.slug}
                    </p>
                    <p className="text-xs text-zinc-600">/{link.slug}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-zinc-400 shrink-0">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{link.scan_count}</span>
                    <span className="text-xs text-zinc-600">scans</span>
                  </div>

                  <Badge variant={link.is_active ? 'success' : 'default'}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credits hint */}
        {profile && profile.credits <= 3 && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              You have <strong>{profile.credits}</strong> credit
              {profile.credits !== 1 ? 's' : ''} remaining.
            </span>
            <Button
              href="/dashboard/settings"
              variant="secondary"
              size="sm"
              className="ml-auto"
            >
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
