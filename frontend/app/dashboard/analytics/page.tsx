'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart2,
  Smartphone,
  Monitor,
  Globe,
  TrendingUp,
  AlertCircle,
  Calendar,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useArLinks } from '@/lib/stores/arLinksStore';
import { useModels } from '@/lib/stores/modelsStore';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/lib/types';

// ─── Range presets ─────────────────────────────────────────────────────────

type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
  preset: Preset;
}

const PRESET_LABELS: Record<Preset, string> = {
  today:  "Aujourd'hui",
  '7d':   '7 derniers jours',
  '30d':  '30 derniers jours',
  '90d':  '90 derniers jours',
  custom: 'Personnalisé',
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildPreset(preset: Exclude<Preset, 'custom'>): DateRange {
  const today = new Date();
  const to = isoDay(today);
  const from = new Date(today);
  switch (preset) {
    case 'today': /* same day */ break;
    case '7d':    from.setUTCDate(from.getUTCDate() - 6);  break;
    case '30d':   from.setUTCDate(from.getUTCDate() - 29); break;
    case '90d':   from.setUTCDate(from.getUTCDate() - 89); break;
  }
  return { preset, from: isoDay(from), to };
}

// ─── Date range picker ─────────────────────────────────────────────────────

function DateRangePicker({
  range, onChange,
}: {
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo]     = useState(range.to);

  const label = range.preset === 'custom'
    ? `${range.from} → ${range.to}`
    : PRESET_LABELS[range.preset];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        {label}
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-3 space-y-3">
          <div className="space-y-0.5">
            {(['today', '7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onChange(buildPreset(p)); setOpen(false); }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                  range.preset === p
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500">Plage personnalisée</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                aria-label="Date de début"
                title="Date de début"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-900 focus:outline-none focus:border-brand-500"
              />
              <input
                type="date"
                aria-label="Date de fin"
                title="Date de fin"
                value={customTo}
                min={customFrom}
                max={isoDay(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({ preset: 'custom', from: customFrom, to: customTo });
                setOpen(false);
              }}
              className="w-full mt-1 inline-flex items-center justify-center h-8 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  // Show at most ~15 labels to avoid crowding
  const labelStep = Math.ceil(data.length / 12);

  return (
    <div className="flex items-end gap-1 h-40 w-full">
      {data.map((b, i) => {
        const pct = Math.round((b.count / max) * 100);
        const showLabel = i % labelStep === 0 || i === data.length - 1;
        const dayLabel = new Date(b.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        return (
          <div
            key={b.date}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
            title={`${dayLabel} : ${b.count} scan${b.count !== 1 ? 's' : ''}`}
          >
            <div className="w-full bg-gray-50 relative flex-1 rounded-t-md overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md bg-brand-500 transition-all duration-500"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center leading-none h-3">
              {showLabel ? dayLabel : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────

function Kpi({ label, value, icon, accent }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 min-h-[130px] flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent ?? 'bg-brand-50 text-brand-600')}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-semibold text-gray-900 tabular-nums leading-tight mt-3">{value}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { models } = useModels();
  const { links }  = useArLinks();

  const [range, setRange]       = useState<DateRange>(buildPreset('7d'));
  const [summary, setSummary]   = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics?from=${range.from}&to=${range.to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data, error: apiError } = await res.json();
        if (apiError) throw new Error(apiError);
        setSummary(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const deviceTotal = summary
    ? summary.ios_count + summary.android_count + summary.desktop_count + summary.unknown_count
    : 0;

  const devices = useMemo(() => summary ? [
    { label: 'iOS',     count: summary.ios_count,     icon: <Smartphone className="w-4 h-4 text-sky-500" />,    color: 'blue'  as const },
    { label: 'Android', count: summary.android_count, icon: <Smartphone className="w-4 h-4 text-emerald-500" />, color: 'green' as const },
    { label: 'Desktop', count: summary.desktop_count, icon: <Monitor    className="w-4 h-4 text-amber-500" />,   color: 'yellow' as const },
    { label: 'Autre',   count: summary.unknown_count, icon: <Globe      className="w-4 h-4 text-gray-400" />,    color: 'brand' as const },
  ] : [], [summary]);

  // Top produits = top liens AR par scan_count, jointure modèle pour le titre
  const topProducts = useMemo(() => {
    return [...links]
      .sort((a, b) => b.scan_count - a.scan_count)
      .slice(0, 5)
      .map((l) => {
        const m = models.find((mm) => mm.id === l.model_id);
        return {
          id: l.id,
          name: l.title ?? m?.name ?? l.slug,
          image: m?.image_url ?? null,
          scans: l.scan_count,
        };
      });
  }, [links, models]);

  // ── Engagement = ratio scans / liens actifs (placeholder utile) ──────────
  const activeLinks = links.filter((l) => l.is_active).length;
  const engagement  = activeLinks > 0 && summary
    ? Math.round((summary.total_scans / activeLinks) * 10) / 10
    : 0;
  const uniqueViews = summary?.total_scans ?? 0; // proxy en attendant cookies

  return (
    <DashboardShell
      title="Analytique"
      subtitle="Suivez la performance de vos expériences AR."
      action={<DateRangePicker range={range} onChange={setRange} />}
    >
      <div className="space-y-5">

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            label="Scans AR"
            value={loading ? '—' : summary?.total_scans ?? 0}
            icon={<BarChart2 className="w-4 h-4" />}
          />
          <Kpi
            label="Engagement"
            value={loading ? '—' : `${engagement}`}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="bg-emerald-50 text-emerald-600"
          />
          <Kpi
            label="Vues uniques"
            value={loading ? '—' : uniqueViews}
            icon={<Eye className="w-4 h-4" />}
            accent="bg-amber-50 text-amber-600"
          />
          <Kpi
            label="Liens actifs"
            value={activeLinks}
            icon={<Smartphone className="w-4 h-4" />}
            accent="bg-sky-50 text-sky-600"
          />
        </div>

        {/* Two-col layout: chart on the left, stacked widgets on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* LEFT — Vues dans le temps (large) */}
          <section className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Vues dans le temps</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {PRESET_LABELS[range.preset]} · {summary?.range_days ?? '—'} jours
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              {loading ? (
                <div className="flex items-end gap-1 h-64">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gray-100 rounded-t-md animate-pulse"
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-64">
                  <BarChart data={summary?.daily_buckets ?? []} />
                </div>
              )}
            </div>
          </section>

          {/* RIGHT — Top produits stacked above Répartition par appareil */}
          <div className="lg:col-span-5 flex flex-col gap-5">

            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Top produits les plus consultés</h2>
              </div>
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                  Aucun scan enregistré pour le moment
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topProducts.map((p, i) => {
                    const max = topProducts[0]?.scans || 1;
                    const pct = Math.round((p.scans / max) * 100);
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 w-4 shrink-0">#{i + 1}</span>
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-gray-900 truncate">{p.name}</p>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">{p.scans}</span>
                          </div>
                          <ProgressBar value={pct} color="brand" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-gray-900">Répartition par appareil</h2>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((d) => {
                    const pct = deviceTotal > 0 ? Math.round((d.count / deviceTotal) * 100) : 0;
                    return (
                      <div key={d.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            {d.icon}
                            {d.label}
                          </div>
                          <span className="text-gray-700 tabular-nums font-medium">
                            {d.count} <span className="text-gray-400">({pct}%)</span>
                          </span>
                        </div>
                        <ProgressBar value={pct} color={d.color} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
