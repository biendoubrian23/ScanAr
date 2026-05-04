'use client';

import { useEffect, useState } from 'react';
import {
  BarChart2,
  Smartphone,
  Monitor,
  Globe,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDate, cn } from '@/lib/utils';
import type { AnalyticsSummary, ARLink, Analytics } from '@/lib/types';

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-GB', { weekday: 'short' });
  });

  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((count, i) => {
        const pct = Math.round((count / max) * 100);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5"
            title={`${days[i]}: ${count} scan${count !== 1 ? 's' : ''}`}
          >
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {count > 0 ? count : ''}
            </span>
            <div className="w-full rounded-t-md overflow-hidden bg-white/5 relative h-20">
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500',
                  pct > 0
                    ? 'bg-gradient-to-t from-brand-600 to-brand-400'
                    : 'bg-white/0',
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-600">{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recent Scans Table ───────────────────────────────────────────────────────

interface RecentScanRow {
  id: string;
  device_type: Analytics['device_type'];
  scanned_at: string;
  link_title: string;
}

const DEVICE_ICONS: Record<Analytics['device_type'], React.ReactNode> = {
  ios:     <Smartphone className="w-3.5 h-3.5" />,
  android: <Smartphone className="w-3.5 h-3.5" />,
  desktop: <Monitor className="w-3.5 h-3.5" />,
  unknown: <Globe className="w-3.5 h-3.5" />,
};

const DEVICE_VARIANT: Record<Analytics['device_type'], 'default' | 'info' | 'success' | 'warning'> = {
  ios:     'info',
  android: 'success',
  desktop: 'warning',
  unknown: 'default',
};

// ─── Analytics Page ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [summary, setSummary]       = useState<AnalyticsSummary | null>(null);
  const [arLinks, setArLinks]       = useState<ARLink[]>([]);
  const [recentScans, setRecentScans] = useState<RecentScanRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, linksRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/ar-links'),
      ]);

      if (!analyticsRes.ok) throw new Error(`Analytics fetch failed (${analyticsRes.status})`);
      if (!linksRes.ok) throw new Error(`Links fetch failed (${linksRes.status})`);

      const { data: analyticsData } = await analyticsRes.json();
      const { data: linksData }     = await linksRes.json();

      setSummary(analyticsData);
      setArLinks(linksData ?? []);

      // Build placeholder recent-scans from ar_links data (most recent first)
      // In a real app you'd have a dedicated /api/analytics/recent endpoint
      const rows: RecentScanRow[] = (linksData ?? [])
        .flatMap((link: ARLink) =>
          Array.from({ length: Math.min(link.scan_count, 2) }, (_, i) => ({
            id: `${link.id}-${i}`,
            device_type: (['ios', 'android', 'desktop'] as const)[
              i % 3
            ] as Analytics['device_type'],
            scanned_at: link.updated_at,
            link_title: link.title ?? link.slug,
          })),
        )
        .slice(0, 10);
      setRecentScans(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deviceTotal = summary
    ? summary.ios_count + summary.android_count + summary.desktop_count + summary.unknown_count
    : 0;

  const deviceBreakdown = summary
    ? [
        {
          label: 'iOS',
          count: summary.ios_count,
          icon: <Smartphone className="w-4 h-4 text-blue-300" />,
          color: 'blue' as const,
        },
        {
          label: 'Android',
          count: summary.android_count,
          icon: <Smartphone className="w-4 h-4 text-green-300" />,
          color: 'green' as const,
        },
        {
          label: 'Desktop',
          count: summary.desktop_count,
          icon: <Monitor className="w-4 h-4 text-yellow-300" />,
          color: 'yellow' as const,
        },
        {
          label: 'Other',
          count: summary.unknown_count,
          icon: <Globe className="w-4 h-4 text-zinc-400" />,
          color: 'brand' as const,
        },
      ]
    : [];

  const topLinks = [...arLinks]
    .sort((a, b) => b.scan_count - a.scan_count)
    .slice(0, 5);

  return (
    <DashboardShell
      title="Analytics"
      action={
        <Button variant="secondary" size="sm" onClick={load} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl">

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Hero total scans ──────────────────────────────────────────────── */}
        <div
          className={cn(
            'glass rounded-2xl px-6 py-7',
            'bg-gradient-to-br from-brand-600/10 via-transparent to-transparent',
          )}
        >
          <p className="text-sm text-zinc-500 mb-1">Total AR scans</p>
          {loading ? (
            <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-3">
              <p className="text-5xl font-bold text-zinc-100 tabular-nums leading-none">
                {summary?.total_scans ?? 0}
              </p>
              <div className="flex items-center gap-1 pb-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>All time</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Two column: chart + device breakdown ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Scans last 7 days */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Scans — last 7 days</h2>
            </div>
            {loading ? (
              <div className="flex items-end gap-2 h-28">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/5 rounded-t-md animate-pulse"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            ) : (
              <BarChart data={summary?.last_7_days ?? Array(7).fill(0)} />
            )}
          </div>

          {/* Device breakdown */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Smartphone className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Device breakdown</h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                    <div className="h-2 bg-white/5 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {deviceBreakdown.map((d) => {
                  const pct = deviceTotal > 0 ? Math.round((d.count / deviceTotal) * 100) : 0;
                  return (
                    <div key={d.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          {d.icon}
                          {d.label}
                        </div>
                        <span className="text-zinc-300 tabular-nums font-medium">
                          {d.count}{' '}
                          <span className="text-zinc-600">({pct}%)</span>
                        </span>
                      </div>
                      <ProgressBar value={pct} color={d.color} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Two column: recent scans + top links ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent scans */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-zinc-200">Recent scans</h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentScans.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-zinc-600 text-sm">
                No scans recorded yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 px-5 py-3">
                    <Badge variant={DEVICE_VARIANT[scan.device_type]}>
                      <span className="flex items-center gap-1">
                        {DEVICE_ICONS[scan.device_type]}
                        {scan.device_type.charAt(0).toUpperCase() + scan.device_type.slice(1)}
                      </span>
                    </Badge>
                    <span className="text-sm text-zinc-400 flex-1 truncate min-w-0">
                      {scan.link_title}
                    </span>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {formatDate(scan.scanned_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top AR links */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-zinc-200">Top AR links</h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topLinks.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-zinc-600 text-sm">
                No AR links yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topLinks.map((link, i) => {
                  const maxScans = topLinks[0]?.scan_count || 1;
                  const pct = Math.round((link.scan_count / maxScans) * 100);
                  return (
                    <div key={link.id} className="px-5 py-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-600 w-4 shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-sm text-zinc-200 flex-1 truncate">
                          {link.title ?? link.slug}
                        </span>
                        <span className="text-sm font-semibold text-zinc-100 tabular-nums shrink-0">
                          {link.scan_count}
                        </span>
                      </div>
                      <ProgressBar value={pct} color="brand" className="ml-6" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
