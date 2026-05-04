'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Clock,
  Link2,
  BarChart2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useAuth } from '@/hooks/useAuth';
import { useModels } from '@/lib/stores/modelsStore';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { formatDate, cn } from '@/lib/utils';
import type { ARLink } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, iconBg, loading }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-6 w-14 bg-gray-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-xl font-semibold text-gray-900 tabular-nums leading-none">{value}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { models, loading: modelsLoading } = useModels();
  const { startUpload, isUploading, uploadError } = useUploadStore();

  const [arLinks, setArLinks]           = useState<ARLink[]>([]);
  const [totalScans, setTotalScans]     = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [linksRes, analyticsRes] = await Promise.all([fetch('/api/ar-links'), fetch('/api/analytics')]);
        if (linksRes.ok)     { const { data } = await linksRes.json();     setArLinks(data ?? []); }
        if (analyticsRes.ok) { const { data } = await analyticsRes.json(); setTotalScans(data?.total_scans ?? 0); }
      } finally { setStatsLoading(false); }
    };
    fetchStats();
  }, []);

  const processingCount = models.filter((m) => m.status === 'processing' || m.status === 'pending').length;
  const recentModels    = models.slice(0, 5);
  const recentArLinks   = arLinks.slice(0, 3);

  const handleFileAccepted = async (file: File) => {
    await startUpload(file, file.name.replace(/\.[^.]+$/, ''));
  };

  const greeting = profile?.full_name
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : 'Welcome back';

  return (
    <DashboardShell title="Dashboard" subtitle={greeting}>
      <div className="space-y-6 max-w-5xl">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Models" value={models.length}    icon={<Box       className="w-4 h-4 text-brand-500" />}   iconBg="bg-brand-50"   loading={modelsLoading} />
          <StatCard label="Processing"   value={processingCount}  icon={<Clock     className="w-4 h-4 text-amber-500" />}   iconBg="bg-amber-50"   loading={modelsLoading} />
          <StatCard label="AR Links"     value={arLinks.length}   icon={<Link2     className="w-4 h-4 text-sky-500"   />}   iconBg="bg-sky-50"     loading={statsLoading}  />
          <StatCard label="Total Scans"  value={totalScans}       icon={<BarChart2 className="w-4 h-4 text-emerald-500" />} iconBg="bg-emerald-50" loading={statsLoading}  />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Models */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Recent Models</h2>
              <Link href="/dashboard/models" className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {modelsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-11 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            ) : recentModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Box className="w-7 h-7 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No models yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Upload an image to get started</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentModels.map((model) => (
                  <li key={model.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {model.image_url
                        ? <img src={model.image_url} alt="" className="w-full h-full object-cover" />
                        : <Box className="w-3.5 h-3.5 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{model.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(model.created_at)}</p>
                    </div>
                    <Badge status={model.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Quick Upload */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Quick Upload</h2>
              <p className="text-xs text-gray-400 mt-0.5">Drop an image to generate a 3D model</p>
            </div>

            <div className="p-4 space-y-3">
              <UploadZone onFileAccepted={handleFileAccepted} disabled={isUploading} />

              {uploadError && !isUploading && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {uploadError}
                </div>
              )}

              {(isUploading || processingCount > 0) && (
                <p className="text-xs text-gray-500 text-center">
                  Progress is shown in the floating widget on the bottom right →
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Recent AR Activity */}
        {recentArLinks.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Recent AR Activity</h2>
              <Link href="/dashboard/ar-links" className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recentArLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {link.qr_url
                    ? <img src={link.qr_url} alt="QR" className="w-9 h-9 rounded-lg object-cover bg-white p-0.5 border border-gray-200 shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Link2 className="w-3.5 h-3.5 text-gray-400" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{link.title ?? link.slug}</p>
                    <p className="text-xs text-gray-400">/{link.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{link.scan_count}</span>
                    <span className="text-gray-400">scans</span>
                  </div>
                  <Badge variant={link.is_active ? 'success' : 'default'}>{link.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile && profile.credits <= 3 && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You have <strong>{profile.credits}</strong> credit{profile.credits !== 1 ? 's' : ''} remaining.</span>
            <Button href="/dashboard/settings" variant="secondary" size="sm" className="ml-auto">Upgrade</Button>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
