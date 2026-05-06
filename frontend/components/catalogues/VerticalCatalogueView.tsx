'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Box as BoxIcon,
  Globe,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Music2,
  Store,
  ScanSearch,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  ScanLine,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCatalogueEvent } from '@/lib/catalogueTracking';
import type { Catalogue, CatalogueItemWithModel, CatalogueSocials } from '@/lib/types';
import { THEME_TOKENS, type ThemeTokens } from './theme';
import { PublicStatsPanel } from './PublicStatsPanel';

interface VerticalCatalogueViewProps {
  catalogue:    Catalogue;
  items:        CatalogueItemWithModel[];
  previewMode?: boolean;
}

const SOCIAL_ICONS: Record<keyof CatalogueSocials, React.ElementType> = {
  instagram: Instagram,
  website:   Globe,
  email:     Mail,
  store:     Store,
  whatsapp:  MessageCircle,
  tiktok:    Music2,
  facebook:  Facebook,
};

const SOCIAL_ORDER: (keyof CatalogueSocials)[] = [
  'instagram', 'website', 'email', 'store', 'whatsapp', 'tiktok', 'facebook',
];

export function VerticalCatalogueView({ catalogue, items, previewMode = false }: VerticalCatalogueViewProps) {
  const t = THEME_TOKENS[catalogue.theme];

  useEffect(() => {
    if (previewMode) return;
    trackCatalogueEvent(catalogue.slug, 'catalogue_view');
  }, [previewMode, catalogue.slug]);

  const socials = SOCIAL_ORDER
    .map((k) => ({ key: k, value: catalogue.socials[k] }))
    .filter((s) => !!s.value);

  const outerCardShadow = catalogue.theme === 'dark'
    ? '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)';

  return (
    <main className={cn('min-h-screen w-full relative overflow-x-hidden', t.pageBg)}>
      {/* Decorative orbs */}
      <div className={cn('pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-70', t.orbColor)} />
      <div className={cn('pointer-events-none absolute -top-20 right-[-6rem] w-72 h-72 rounded-full blur-3xl opacity-70', t.orbColor)} />

      <div className="relative max-w-[34rem] mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-7">
            <div className="rounded-full p-[3px] bg-gradient-to-tr from-fuchsia-400 via-indigo-400 to-blue-400 shadow-[0_8px_30px_-6px_rgba(99,102,241,0.45)]">
              <div className="w-28 h-28 rounded-full bg-white overflow-hidden flex items-center justify-center">
                {catalogue.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={catalogue.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className={cn('w-10 h-10', t.mutedColor)} />
                )}
              </div>
            </div>
            <span
              className={cn(
                'absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md ring-2 ring-white',
                t.badgeBg,
                t.badgeText,
              )}
            >
              <BoxIcon className="w-3 h-3" />
              AR
            </span>
          </div>

          <h1 className={cn('text-3xl font-bold tracking-tight flex items-center justify-center gap-2', t.titleColor)}>
            {catalogue.title}
            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/15" aria-hidden="true" />
          </h1>
          {catalogue.subtitle && (
            <p className={cn('text-sm mt-2', t.bodyColor)}>{catalogue.subtitle}</p>
          )}
          {catalogue.location && (
            <p className={cn('text-xs mt-2 inline-flex items-center gap-1', t.mutedColor)}>
              <span aria-hidden="true">📍</span>
              {catalogue.location}
            </p>
          )}
        </header>

        {/* Socials — neumorphic pill buttons, no scrollbar visible */}
        {socials.length > 0 && (
          <div
            className="overflow-x-auto mb-7"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <nav
              aria-label="Liens sociaux"
              className="flex gap-3 w-max mx-auto min-w-full justify-center px-1"
            >
              {socials.map(({ key, value }) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={ensureUrl(key, value!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!previewMode) {
                        trackCatalogueEvent(catalogue.slug, 'social_click', { metadata: { key } });
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={cn(
                        'w-[4.25rem] h-[4.25rem] rounded-[1.25rem] flex items-center justify-center',
                        'transition-all duration-200 group-hover:-translate-y-1 group-active:scale-95',
                        t.socialBtnBg,
                      )}
                      style={{ boxShadow: t.neuShadow }}
                    >
                      <Icon className={cn('w-6 h-6', t.bodyColor)} strokeWidth={1.5} />
                    </div>
                    <span className={cn('text-[10px] font-medium', t.mutedColor)}>
                      {labelFor(key)}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        )}

        {/* Products — outer glass card + individual mini-cards per product */}
        <section
          className={cn('rounded-3xl overflow-hidden', t.glassCard)}
          style={{ boxShadow: outerCardShadow }}
        >
          <header className="px-4 pt-4 pb-3">
            <h2 className={cn('text-sm font-semibold inline-flex items-center gap-1.5', t.titleColor)}>
              Explorer en AR
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            </h2>
            <p className={cn('text-xs mt-0.5', t.mutedColor)}>
              Visualisez nos produits dans votre espace
            </p>
          </header>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <ImageIcon className={cn('w-8 h-8 mx-auto mb-2 opacity-40', t.mutedColor)} />
              <p className={cn('text-sm', t.mutedColor)}>Aucun produit pour le moment.</p>
            </div>
          ) : (
            <div className="px-3 pb-3 flex flex-col gap-2.5">
              {items.map((it) => (
                <ProductCard
                  key={it.id}
                  catalogueSlug={catalogue.slug}
                  item={it}
                  tokens={t}
                  previewMode={previewMode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Optional configurable stats panel */}
        <PublicStatsPanel catalogue={catalogue} items={items} tokens={t} />

        {/* QR + analytics row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div
            className={cn('rounded-2xl p-3.5', t.glassCard)}
            style={{ boxShadow: outerCardShadow }}
          >
            <p className={cn('text-xs font-semibold mb-0.5', t.titleColor)}>Scan to Explore</p>
            <p className={cn('text-[10px] mb-2', t.mutedColor)}>Ouvrir ce profil en AR</p>
            <div className="rounded-lg p-1.5 bg-white border border-gray-100">
              {catalogue.qr_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={catalogue.qr_url} alt="QR code du catalogue" className="w-full h-auto" />
              ) : (
                <div className="aspect-square flex items-center justify-center text-xs text-gray-400">QR…</div>
              )}
            </div>
          </div>

          <div
            className={cn('rounded-2xl p-3.5', t.glassCard)}
            style={{ boxShadow: outerCardShadow }}
          >
            <p className={cn('text-xs font-semibold mb-3', t.titleColor)}>Live Analytics</p>
            <div className="space-y-2">
              <Stat icon={<Eye className="w-3.5 h-3.5" />} label="Vues" value={catalogue.view_count} tokens={t} />
              <Stat icon={<BoxIcon className="w-3.5 h-3.5" />} label="Produits" value={items.length} tokens={t} />
              <Stat icon={<TrendingUp className="w-3.5 h-3.5" />} label="Catégories" value={catalogue.categories.length} tokens={t} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-10">
          {previewMode ? (
            <span className={cn('inline-flex items-center gap-2 text-xs', t.mutedColor)}>
              <ScanLine className="w-3.5 h-3.5" />
              Créé avec ScanAR
            </span>
          ) : (
            <Link href="/" className={cn('inline-flex items-center gap-2 text-xs', t.mutedColor)}>
              <ScanLine className="w-3.5 h-3.5" />
              Créé avec ScanAR
            </Link>
          )}
        </footer>
      </div>
    </main>
  );
}

// ─── Product mini-card ────────────────────────────────────────────────────────
function ProductCard({
  catalogueSlug,
  item,
  tokens,
  previewMode,
}: {
  catalogueSlug: string;
  item:          CatalogueItemWithModel;
  tokens:        ThemeTokens;
  previewMode:   boolean;
}) {
  const t = tokens;
  const label       = item.custom_label       || item.model.name;
  const description = item.custom_description || (item.model.description ?? '');

  const miniCardStyle: React.CSSProperties = {
    background:           t.miniCardGlassBg,
    backdropFilter:       'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border:               `1px solid ${t.miniCardGlassBorder}`,
    boxShadow:            t.miniCardNeuShadow,
  };

  const arPillStyle: React.CSSProperties = {
    background:           t.glassArBg,
    backdropFilter:       'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border:               `1px solid ${t.glassArBorder}`,
    boxShadow:            '0 3px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
  };

  return (
    <div
      className="rounded-2xl px-3 py-3 flex items-center gap-3"
      style={miniCardStyle}
    >
      {/* Thumb */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/60 flex items-center justify-center">
          {item.model.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.model.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <BoxIcon className={cn('w-5 h-5', t.mutedColor)} />
          )}
        </div>
        {item.badge && (
          <span className={cn(
            'absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold shadow-sm',
            t.badgeBg,
            t.badgeText,
          )}>
            {item.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', t.titleColor)}>{label}</p>
        {description && (
          <p className={cn('text-xs mt-0.5 line-clamp-2', t.mutedColor)}>{description}</p>
        )}
        {item.price && (
          <p className={cn('text-sm font-semibold mt-1', t.titleColor)}>{item.price}</p>
        )}
      </div>

      {/* AR pill button */}
      {previewMode ? (
        <span
          className={cn(
            'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold',
            t.arButtonText,
          )}
          style={arPillStyle}
        >
          <ScanSearch className="w-3 h-3" />
          Voir en AR
        </span>
      ) : (
        <Link
          href={`/c/${catalogueSlug}/ar/${item.id}`}
          onClick={() => trackCatalogueEvent(catalogueSlug, 'item_ar_open', { itemId: item.id })}
          className={cn(
            'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold',
            'transition-all duration-200 active:scale-95',
            t.arButtonText,
          )}
          style={arPillStyle}
        >
          <ScanSearch className="w-3 h-3" />
          Voir en AR
        </Link>
      )}
    </div>
  );
}

// ─── Mini stat row ────────────────────────────────────────────────────────────
function Stat({
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureUrl(key: keyof CatalogueSocials, raw: string): string {
  if (key === 'email')    return raw.startsWith('mailto:') ? raw : `mailto:${raw}`;
  if (key === 'whatsapp') {
    if (raw.startsWith('http')) return raw;
    return `https://wa.me/${raw.replace(/[^0-9]/g, '')}`;
  }
  if (raw.startsWith('http')) return raw;
  return `https://${raw}`;
}

function labelFor(key: keyof CatalogueSocials): string {
  switch (key) {
    case 'instagram': return 'Instagram';
    case 'website':   return 'Site web';
    case 'email':     return 'Email';
    case 'store':     return 'Boutique';
    case 'whatsapp':  return 'WhatsApp';
    case 'tiktok':    return 'TikTok';
    case 'facebook':  return 'Facebook';
  }
}
