'use client';

import {
  Sparkles,
  Eye,
  Box as BoxIcon,
  Hash,
  Calendar,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATS_BLOCK_LABELS,
  type Catalogue,
  type CatalogueItemWithModel,
  type StatsBlock,
} from '@/lib/types';
import type { ThemeTokens } from './theme';

interface PublicStatsPanelProps {
  catalogue: Catalogue;
  items:     CatalogueItemWithModel[];
  tokens:    ThemeTokens;
}

export function PublicStatsPanel({ catalogue, items, tokens }: PublicStatsPanelProps) {
  if (!catalogue.stats_visible) return null;
  const blocks = catalogue.stats_config?.blocks ?? [];
  if (blocks.length === 0) return null;

  return (
    <section className="mt-5 space-y-3">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} catalogue={catalogue} items={items} tokens={tokens} />
      ))}
    </section>
  );
}

// ─── Block renderer ─────────────────────────────────────────────────────────
function BlockRenderer({
  block, catalogue, items, tokens,
}: {
  block:     StatsBlock;
  catalogue: Catalogue;
  items:     CatalogueItemWithModel[];
  tokens:    ThemeTokens;
}) {
  const title = block.title?.trim() || STATS_BLOCK_LABELS[block.type];
  const limit = Math.max(1, Math.min(20, block.limit ?? 5));

  switch (block.type) {
    case 'summary':
      return <SummaryBlock title={title} catalogue={catalogue} items={items} tokens={tokens} />;
    case 'top_viewed': {
      const sorted = [...items]
        .sort((a, b) => b.view_count - a.view_count)
        .filter((it) => it.view_count > 0)
        .slice(0, limit);
      return (
        <ItemListBlock
          title={title}
          tokens={tokens}
          items={sorted}
          rightSlot={(it) => (
            <span className={cn('text-xs font-semibold tabular-nums inline-flex items-center gap-1', tokens.titleColor)}>
              <Eye className="w-3 h-3 opacity-60" />
              {it.view_count}
            </span>
          )}
          icon={<TrendingUp className="w-3.5 h-3.5 text-amber-500" />}
          emptyText="Aucune ouverture AR pour le moment."
        />
      );
    }
    case 'top_priced': {
      const dir = block.sort === 'asc' ? 1 : -1;
      const priced = items
        .map((it) => ({ it, num: parsePrice(it.price) }))
        .filter((p) => p.num !== null);
      priced.sort((a, b) => ((a.num! - b.num!) * dir));
      const sorted = priced.slice(0, limit).map((p) => p.it);
      return (
        <ItemListBlock
          title={title}
          tokens={tokens}
          items={sorted}
          rightSlot={(it) => (
            <span className={cn('text-xs font-semibold tabular-nums', tokens.titleColor)}>
              {it.price}
            </span>
          )}
          icon={<Tag className="w-3.5 h-3.5 text-emerald-500" />}
          emptyText="Aucun produit avec un prix renseigné."
        />
      );
    }
    case 'recent': {
      const sorted = [...items]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
      return (
        <ItemListBlock
          title={title}
          tokens={tokens}
          items={sorted}
          rightSlot={(it) => (
            <span className={cn('text-[10px] tabular-nums', tokens.mutedColor)}>
              {formatRelativeDate(it.created_at)}
            </span>
          )}
          icon={<Calendar className="w-3.5 h-3.5 text-indigo-500" />}
          emptyText="Aucun produit récent."
        />
      );
    }
    case 'by_category':
      return <ByCategoryBlock title={title} catalogue={catalogue} items={items} tokens={tokens} limit={limit} />;
  }
}

// ─── Summary block ──────────────────────────────────────────────────────────
function SummaryBlock({
  title, catalogue, items, tokens,
}: {
  title:     string;
  catalogue: Catalogue;
  items:     CatalogueItemWithModel[];
  tokens:    ThemeTokens;
}) {
  const totalArOpens = items.reduce((sum, it) => sum + it.view_count, 0);
  return (
    <div className={cn('rounded-2xl border p-4', tokens.cardBg, tokens.cardBorder)}>
      <Header title={title} tokens={tokens} icon={<Sparkles className="w-3.5 h-3.5 text-yellow-500" />} />
      <div className="grid grid-cols-2 gap-3">
        <SummaryStat icon={<Eye className="w-3.5 h-3.5" />}     label="Vues"          value={catalogue.view_count}    tokens={tokens} />
        <SummaryStat icon={<BoxIcon className="w-3.5 h-3.5" />} label="Produits"      value={items.length}            tokens={tokens} />
        <SummaryStat icon={<Hash className="w-3.5 h-3.5" />}    label="Catégories"    value={catalogue.categories.length} tokens={tokens} />
        <SummaryStat icon={<TrendingUp className="w-3.5 h-3.5" />} label="Ouvertures AR" value={totalArOpens}            tokens={tokens} />
      </div>
    </div>
  );
}

function SummaryStat({
  icon, label, value, tokens,
}: {
  icon:   React.ReactNode;
  label:  string;
  value:  number;
  tokens: ThemeTokens;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn('inline-flex items-center gap-1.5', tokens.mutedColor)}>
        {icon}
        {label}
      </span>
      <span className={cn('font-bold tabular-nums', tokens.titleColor)}>{value}</span>
    </div>
  );
}

// ─── Item list block ────────────────────────────────────────────────────────
function ItemListBlock({
  title, tokens, items, rightSlot, icon, emptyText,
}: {
  title:     string;
  tokens:    ThemeTokens;
  items:     CatalogueItemWithModel[];
  rightSlot: (it: CatalogueItemWithModel) => React.ReactNode;
  icon?:     React.ReactNode;
  emptyText: string;
}) {
  return (
    <div className={cn('rounded-2xl border overflow-hidden', tokens.cardBg, tokens.cardBorder)}>
      <div className="px-4 py-3 border-b border-current/10">
        <Header title={title} tokens={tokens} icon={icon} />
      </div>
      {items.length === 0 ? (
        <p className={cn('text-xs text-center py-6', tokens.mutedColor)}>{emptyText}</p>
      ) : (
        <ul className="divide-y divide-current/10">
          {items.map((it, i) => (
            <li key={it.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className={cn('text-[10px] font-mono w-4 shrink-0', tokens.mutedColor)}>
                #{i + 1}
              </span>
              <div className={cn('w-9 h-9 rounded-lg border overflow-hidden shrink-0', tokens.cardBorder)}>
                {it.model.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.model.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={cn('w-full h-full flex items-center justify-center', tokens.mutedColor)}>
                    <BoxIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <p className={cn('flex-1 min-w-0 text-xs font-medium truncate', tokens.titleColor)}>
                {it.custom_label || it.model.name}
              </p>
              <div className="shrink-0">{rightSlot(it)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── By-category block ──────────────────────────────────────────────────────
function ByCategoryBlock({
  title, catalogue, items, tokens, limit,
}: {
  title:     string;
  catalogue: Catalogue;
  items:     CatalogueItemWithModel[];
  tokens:    ThemeTokens;
  limit:     number;
}) {
  // Group items by category_id; show all defined categories + an "Autres" bucket
  const groups: { id: string | null; label: string; entries: CatalogueItemWithModel[] }[] = [
    ...catalogue.categories.map((c) => ({
      id:      c.id,
      label:   c.label,
      entries: items.filter((it) => it.category_id === c.id),
    })),
  ];
  const orphans = items.filter((it) => !it.category_id || !catalogue.categories.find((c) => c.id === it.category_id));
  if (orphans.length > 0) groups.push({ id: null, label: 'Autres', entries: orphans });

  const populated = groups.filter((g) => g.entries.length > 0);

  return (
    <div className={cn('rounded-2xl border overflow-hidden', tokens.cardBg, tokens.cardBorder)}>
      <div className="px-4 py-3 border-b border-current/10">
        <Header title={title} tokens={tokens} icon={<Hash className="w-3.5 h-3.5 text-fuchsia-500" />} />
      </div>
      {populated.length === 0 ? (
        <p className={cn('text-xs text-center py-6', tokens.mutedColor)}>
          Aucune catégorie populaire pour le moment.
        </p>
      ) : (
        <div className="divide-y divide-current/10">
          {populated.map((g) => (
            <div key={g.id ?? '__none__'} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn('text-xs font-semibold', tokens.titleColor)}>{g.label}</span>
                <span className={cn('text-[10px] tabular-nums', tokens.mutedColor)}>
                  {g.entries.length}
                </span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {g.entries.slice(0, limit).map((it) => (
                  <li
                    key={it.id}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] border',
                      tokens.cardBorder,
                      tokens.bodyColor,
                    )}
                  >
                    {it.custom_label || it.model.name}
                  </li>
                ))}
                {g.entries.length > limit && (
                  <li className={cn('px-2 py-0.5 rounded-md text-[11px]', tokens.mutedColor)}>
                    +{g.entries.length - limit}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header (shared) ────────────────────────────────────────────────────────
function Header({ title, tokens, icon }: { title: string; tokens: ThemeTokens; icon?: React.ReactNode }) {
  return (
    <h3 className={cn('text-xs font-semibold inline-flex items-center gap-1.5', tokens.titleColor)}>
      {icon}
      {title}
    </h3>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  // Tolerant parser: keep digits, dot, and one comma as decimal separator.
  const cleaned = raw
    .replace(/[^\d,.\-]/g, '')
    .replace(/(\d),(\d{1,2})(?:\D|$)/, '$1.$2')
    .replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const days   = Math.floor(diffMs / (24 * 3600 * 1000));
  if (days < 1)  return "aujourd'hui";
  if (days < 2)  return 'hier';
  if (days < 7)  return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`;
  if (days < 365) return `il y a ${Math.floor(days / 30)}mois`;
  return `il y a ${Math.floor(days / 365)}an`;
}
