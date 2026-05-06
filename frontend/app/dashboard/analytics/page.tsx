'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  LayoutGrid,
  ScanSearch,
  MousePointerClick,
  Box as BoxIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useArLinks } from '@/lib/stores/arLinksStore';
import { useModels } from '@/lib/stores/modelsStore';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/lib/types';
import type { CatalogueAnalyticsSummary } from '@/app/api/catalogues/analytics/route';

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

// ─── Time-series chart (SVG, with axes) ────────────────────────────────────

/** Round a max value up to a "nice" number so y-axis ticks read cleanly. */
function niceMax(raw: number): number {
  if (raw <= 1) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function TimeSeriesChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        Aucune donnée pour cette période
      </div>
    );
  }

  // ── Scales ─────────────────────────────────────────────────────────────
  const rawMax  = Math.max(...data.map((d) => d.count));
  const yMax    = niceMax(rawMax || 1);
  const tickN   = Math.min(yMax, 4);
  const yTicks  = Array.from({ length: tickN + 1 }, (_, i) => Math.round((i * yMax) / tickN));

  // SVG viewBox — fixed coordinate system, scales responsively via CSS.
  const W = 720, H = 260;
  const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xAt = (i: number): number =>
    data.length === 1
      ? PAD.left + innerW / 2
      : PAD.left + (i / (data.length - 1)) * innerW;
  const yAt = (v: number): number =>
    PAD.top + innerH - (v / yMax) * innerH;

  const points  = data.map((d, i) => `${xAt(i)},${yAt(d.count)}`);
  const baselineY = yAt(0);

  // X-axis labels: aim for ~6–8 visible labels max.
  const xLabelStep = Math.max(1, Math.ceil(data.length / 7));
  const fmtDay = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
      role="img"
      aria-label="Vues dans le temps"
    >
      <defs>
        <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Grid + Y-axis labels ─────────────────────────────────────── */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={yAt(t)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="11"
            fill="#94a3b8"
          >
            {t}
          </text>
        </g>
      ))}

      {/* ── X-axis baseline (slightly stronger than grid) ─────────────── */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={baselineY}
        y2={baselineY}
        stroke="#cbd5e1"
        strokeWidth="1"
      />

      {/* ── Area fill (only meaningful when data.length >= 2) ────────── */}
      {data.length > 1 && (
        <path
          d={`M ${xAt(0)},${baselineY} L ${points.join(' L ')} L ${xAt(data.length - 1)},${baselineY} Z`}
          fill="url(#chart-area-gradient)"
        />
      )}

      {/* ── Line ─────────────────────────────────────────────────────── */}
      {data.length > 1 && (
        <path
          d={`M ${points.join(' L ')}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* ── Data points (always visible, with white halo for contrast) ─ */}
      {data.map((d, i) => (
        <g key={d.date}>
          <title>{`${fmtDay(d.date)} : ${d.count} scan${d.count !== 1 ? 's' : ''}`}</title>
          <circle cx={xAt(i)} cy={yAt(d.count)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
        </g>
      ))}

      {/* ── X-axis labels ────────────────────────────────────────────── */}
      {data.map((d, i) => {
        const isLast  = i === data.length - 1;
        const isFirst = i === 0;
        const onStep  = i % xLabelStep === 0;
        if (!onStep && !isLast && !isFirst) return null;
        return (
          <text
            key={`xl-${d.date}`}
            x={xAt(i)}
            y={H - PAD.bottom + 16}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
          >
            {fmtDay(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────

function Kpi({ label, value, icon }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 sm:min-h-[130px] flex flex-col gap-1.5 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <span className="text-gray-400 shrink-0" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-2xl sm:text-4xl font-semibold text-gray-900 tabular-nums leading-tight">{value}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { models } = useModels();
  const { links }  = useArLinks();

  const [range, setRange]                 = useState<DateRange>(buildPreset('7d'));
  const [summary, setSummary]             = useState<AnalyticsSummary | null>(null);
  const [catSummary, setCatSummary]       = useState<CatalogueAnalyticsSummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [catLoading, setCatLoading]       = useState(true);
  const [error, setError]                 = useState<string | null>(null);

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

  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      try {
        const res = await fetch(`/api/catalogues/analytics?from=${range.from}&to=${range.to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data, error: apiError } = await res.json();
        if (apiError) throw new Error(apiError);
        setCatSummary(data);
      } catch (e) {
        // Don't block the AR analytics block on catalogue errors — surface a side toast instead.
        console.error('[catalogue analytics]', e);
        setCatSummary(null);
      } finally {
        setCatLoading(false);
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

        {/* On mobile: Chart appears FIRST (order-1), KPIs second (order-2),
            side widgets last (order-3). On desktop, the natural reading order
            is restored: KPIs at the top, chart + side widgets in a 2-col grid
            below. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* KPIs row — full-width on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Kpi
              label="Scans AR"
              value={loading ? '—' : summary?.total_scans ?? 0}
              icon={<BarChart2 className="w-4 h-4" />}
            />
            <Kpi
              label="Engagement"
              value={loading ? '—' : `${engagement}`}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <Kpi
              label="Vues uniques"
              value={loading ? '—' : uniqueViews}
              icon={<Eye className="w-4 h-4" />}
            />
            <Kpi
              label="Liens actifs"
              value={activeLinks}
              icon={<Smartphone className="w-4 h-4" />}
            />
          </div>

          {/* Chart — order-1 on mobile (above KPIs), order-2 on desktop. On
              mobile we shrink the vertical footprint so the chart reads as a
              wide horizontal panel rather than dominating the fold. */}
          <section className="order-1 lg:order-2 lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Vues dans le temps</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {PRESET_LABELS[range.preset]} · {summary?.range_days ?? '—'} jours
                </p>
              </div>
            </div>
            <div className="flex-1 h-[140px] sm:h-auto sm:min-h-[260px]">
              {loading ? (
                <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
              ) : (
                <TimeSeriesChart data={summary?.daily_buckets ?? []} />
              )}
            </div>
          </section>

          {/* RIGHT — Top produits stacked above Répartition par appareil */}
          <div className="order-3 lg:col-span-5 flex flex-col gap-5">

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

        {/* ─── Catalogues block ─────────────────────────────────────────── */}
        <CataloguesBlock summary={catSummary} loading={catLoading} />
      </div>
    </DashboardShell>
  );
}

// ─── Catalogues block ──────────────────────────────────────────────────────
function CataloguesBlock({
  summary, loading,
}: {
  summary: CatalogueAnalyticsSummary | null;
  loading: boolean;
}) {
  const top    = summary?.top_catalogues ?? [];
  const items  = summary?.top_items ?? [];
  const social = summary?.social_breakdown ?? {};
  const socialEntries = Object.entries(social).sort((a, b) => b[1] - a[1]);

  return (
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Catalogues</h2>
        </div>
        <Link
          href="/dashboard/catalogues"
          className="text-xs text-brand-600 hover:text-brand-700"
        >
          Gérer mes catalogues →
        </Link>
      </header>

      <div className="p-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Kpi
            label="Vues catalogues"
            value={loading ? '—' : summary?.total_catalogue_views ?? 0}
            icon={<Eye className="w-4 h-4" />}
          />
          <Kpi
            label="Ouvertures AR"
            value={loading ? '—' : summary?.total_ar_opens ?? 0}
            icon={<ScanSearch className="w-4 h-4" />}
          />
          <Kpi
            label="Clics sociaux"
            value={loading ? '—' : summary?.total_social_clicks ?? 0}
            icon={<MousePointerClick className="w-4 h-4" />}
          />
          <Kpi
            label="Catalogues actifs"
            value={loading ? '—' : summary?.active_catalogues ?? 0}
            icon={<LayoutGrid className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top catalogues */}
          <div className="bg-gray-50/60 border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Top catalogues</h3>
              <p className="text-xs text-gray-500 mt-0.5">Vues sur la période sélectionnée</p>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : top.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                Aucune vue enregistrée
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {top.map((c, i) => {
                  const max = top[0]?.view_count || 1;
                  const pct = Math.round((c.view_count / max) * 100);
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-4 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/c/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-900 truncate hover:text-brand-700"
                          >
                            {c.title}
                          </Link>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {c.view_count}
                          </span>
                        </div>
                        <ProgressBar value={pct} color="brand" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top items + Social breakdown */}
          <div className="space-y-4">
            <div className="bg-gray-50/60 border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Top produits AR</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ouvertures AR sur la période</p>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  Aucune ouverture AR
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((it, i) => (
                    <div key={it.id} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-4 shrink-0">#{i + 1}</span>
                      {it.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <BoxIcon className="w-8 h-8 p-1.5 rounded-lg bg-gray-100 text-gray-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{it.label}</p>
                        <Link
                          href={`/c/${it.catalogue_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-gray-500 hover:text-brand-700 truncate font-mono"
                        >
                          /c/{it.catalogue_slug}
                        </Link>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                        {it.ar_open_count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {socialEntries.length > 0 && (
              <div className="bg-gray-50/60 border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Clics par réseau</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {socialEntries.map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 capitalize">{key}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
