'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCatalogueEvent } from '@/lib/catalogueTracking';
import type { Catalogue, CatalogueDesign, CatalogueItemWithModel, CatalogueSocials } from '@/lib/types';
import { type ThemeTokens } from './theme';
import { resolveCatalogueStyles, radiusToCss, socialsRadiusToCss } from './resolveDesign';

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
  const styles = resolveCatalogueStyles(catalogue);
  const { tokens: t, design, pageBgStyle, accentInline, titleFont, subtitleFont } = styles;
  const presetKey = design.background.preset ?? catalogue.theme;

  useEffect(() => {
    if (previewMode) return;
    trackCatalogueEvent(catalogue.slug, 'catalogue_view');
  }, [previewMode, catalogue.slug]);

  const hiddenSocials = new Set<keyof CatalogueSocials>(design.socials.hidden ?? []);
  const socials = SOCIAL_ORDER.filter((k) => !hiddenSocials.has(k));

  const outerCardShadow = presetKey === 'dark'
    ? '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)';

  // Header layout helpers
  const headerAlignClass =
    design.header.align === 'left'  ? 'items-start text-left' :
    design.header.align === 'right' ? 'items-end text-right' :
                                      'items-center text-center';

  const isHorizHeader = design.header.layout === 'avatar-left' || design.header.layout === 'avatar-right';
  const showAvatar    = design.header.avatar.show;
  const showSubtitle  = design.header.subtitle.show && !!catalogue.subtitle;
  const showLocation  = design.header.location.show && !!catalogue.location;

  // Cover banner: shown in cover mode (replaces page bg) or as an opt-in banner above header
  const showCoverBanner = design.background.mode === 'cover' && !!design.background.cover?.url;

  // Socials radius
  const socialsRadius = socialsRadiusToCss(design.socials.radius);
  const socialsAlignJustify =
    design.socials.align === 'left'  ? 'justify-start' :
    design.socials.align === 'right' ? 'justify-end' :
                                       'justify-center';

  return (
    <main
      className={cn('min-h-screen w-full relative overflow-x-hidden', !pageBgStyle && t.pageBg)}
      style={pageBgStyle ?? undefined}
    >
      {/* Decorative orbs (only over preset/gradient bg, not over a cover image) */}
      {!showCoverBanner && (
        <>
          <div className={cn('pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-70', t.orbColor)} />
          <div className={cn('pointer-events-none absolute -top-20 right-[-6rem] w-72 h-72 rounded-full blur-3xl opacity-70', t.orbColor)} />
        </>
      )}

      <div
        className="relative max-w-[34rem] mx-auto pt-10 pb-16"
        style={{ paddingLeft: `${design.products.outerInset}px`, paddingRight: `${design.products.outerInset}px` }}
      >
        {/* Header */}
        <header
          className={cn(
            'mb-8',
            isHorizHeader
              ? cn(
                  'flex',
                  design.header.layout === 'avatar-right' ? 'flex-row-reverse' : 'flex-row',
                  'items-center gap-4',
                )
              : cn('flex flex-col', headerAlignClass),
          )}
        >
          {showAvatar && (
            <div className={cn('relative shrink-0', isHorizHeader ? '' : 'mb-7')}>
              <div className="rounded-full p-[3px] bg-gradient-to-tr from-fuchsia-400 via-indigo-400 to-blue-400 shadow-[0_8px_30px_-6px_rgba(99,102,241,0.45)]"
                   style={{ borderRadius: radiusToCss(design.header.avatar.radius) }}>
                <div
                  className="relative bg-white overflow-hidden flex items-center justify-center"
                  style={{
                    width:        `${design.header.avatar.size}px`,
                    height:       `${design.header.avatar.size}px`,
                    borderRadius: radiusToCss(design.header.avatar.radius),
                  }}
                >
                  {catalogue.avatar_url ? (
                    <Image
                      src={catalogue.avatar_url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  ) : (
                    <Sparkles className={cn('w-10 h-10', t.mutedColor)} />
                  )}
                </div>
              </div>
              {!isHorizHeader && (
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
              )}
            </div>
          )}

          <div className={cn(isHorizHeader ? 'flex-1 min-w-0' : 'w-full')}>
            <h1
              className={cn('font-bold tracking-tight flex items-center gap-2', t.titleColor,
                isHorizHeader ? '' : (
                  design.header.align === 'center' ? 'justify-center' :
                  design.header.align === 'right'  ? 'justify-end' : 'justify-start'
                ),
              )}
              style={{
                fontFamily: titleFont,
                fontSize:   `${design.header.title.size}px`,
                fontWeight: design.header.title.weight,
              }}
            >
              {design.header.title.emoji && <span aria-hidden="true">{design.header.title.emoji}</span>}
              {catalogue.title}
              <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/15 shrink-0" aria-hidden="true" />
            </h1>
            {showSubtitle && (
              <p
                className={cn(t.bodyColor)}
                style={{
                  fontFamily: subtitleFont,
                  fontSize:   `${design.header.subtitle.size}px`,
                  marginTop:  `${design.header.spacing.titleToSubtitle}px`,
                }}
              >
                {catalogue.subtitle}
              </p>
            )}
            {showLocation && (
              <p
                className={cn('text-xs inline-flex items-center gap-1', t.mutedColor)}
                style={{ marginTop: `${design.header.spacing.subtitleToLocation}px` }}
              >
                <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {catalogue.location}
              </p>
            )}
          </div>
        </header>

        {/* Socials — pill / icons / compact */}
        {design.socials.show && socials.length > 0 && (
          <div className="overflow-x-auto mb-7 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <nav
              aria-label="Liens sociaux"
              className={cn('flex w-max mx-auto min-w-full px-1', socialsAlignJustify)}
              style={{ gap: `${design.socials.gap}px` }}
            >
              {socials.map((key) => {
                const Icon = SOCIAL_ICONS[key];
                const value = catalogue.socials[key];
                const isEmpty = !value;
                const iconSize = Math.round(design.socials.size * 0.35);

                if (isEmpty) {
                  return (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn('flex items-center justify-center opacity-35', t.socialBtnBg)}
                        style={{ width: `${design.socials.size}px`, height: `${design.socials.size}px`, borderRadius: socialsRadius, boxShadow: t.neuShadow }}
                      >
                        <Icon className={cn(t.bodyColor)} style={{ width: `${iconSize}px`, height: `${iconSize}px` }} strokeWidth={1.5} />
                      </div>
                      {design.socials.layout !== 'icons' && (
                        <span className={cn('text-[10px] font-medium opacity-35', t.mutedColor)}>{labelFor(key)}</span>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={key}
                    href={ensureUrl(key, value!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (!previewMode) trackCatalogueEvent(catalogue.slug, 'social_click', { metadata: { key } }); }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={cn('flex items-center justify-center transition-all duration-200 group-hover:-translate-y-1 group-active:scale-95', t.socialBtnBg)}
                      style={{ width: `${design.socials.size}px`, height: `${design.socials.size}px`, borderRadius: socialsRadius, boxShadow: t.neuShadow }}
                    >
                      <Icon className={cn(t.bodyColor)} style={{ width: `${iconSize}px`, height: `${iconSize}px` }} strokeWidth={1.5} />
                    </div>
                    {design.socials.layout !== 'icons' && (
                      <span className={cn('text-[10px] font-medium', t.mutedColor)}>{labelFor(key)}</span>
                    )}
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
            <div
              className="flex flex-col"
              style={{
                paddingLeft:   `${design.products.inset}px`,
                paddingRight:  `${design.products.inset}px`,
                paddingBottom: `${design.products.inset}px`,
                gap:           `${design.products.gap}px`,
              }}
            >
              {items.map((it) => (
                <ProductCard
                  key={it.id}
                  catalogueSlug={catalogue.slug}
                  item={it}
                  tokens={t}
                  design={design}
                  accentInline={accentInline}
                  previewMode={previewMode}
                />
              ))}
            </div>
          )}
        </section>

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
  design,
  accentInline,
  previewMode,
}: {
  catalogueSlug: string;
  item:          CatalogueItemWithModel;
  tokens:        ThemeTokens;
  design:        CatalogueDesign;
  accentInline:  React.CSSProperties;
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
    borderRadius:         `${design.products.radius}px`,
  };

  const arPillStyle: React.CSSProperties = {
    ...accentInline,
    backdropFilter:       'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border:               `1px solid rgba(255,255,255,0.25)`,
    boxShadow:            '0 3px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
  };

  return (
    <div
      className="px-3 py-3 flex items-center gap-3"
      style={miniCardStyle}
    >
      {/* Thumb */}
      <div className="relative shrink-0">
        <div
          className="relative rounded-xl overflow-hidden bg-white/60 flex items-center justify-center"
          style={{ width: `${design.products.thumbSize}px`, height: `${design.products.thumbSize}px` }}
        >
          {item.model.image_url ? (
            <Image
              src={item.model.image_url}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
            />
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
        <p
          className={cn('font-semibold truncate', t.titleColor)}
          style={{ fontSize: `${design.products.titleSize}px` }}
        >
          {label}
        </p>
        {description && (
          <p
            className={cn('mt-0.5 line-clamp-2', t.mutedColor)}
            style={{ fontSize: `${design.products.descSize}px` }}
          >
            {description}
          </p>
        )}
        {item.price && (
          <p
            className={cn('font-semibold mt-1', t.titleColor)}
            style={{ fontSize: `${design.products.priceSize}px` }}
          >
            {item.price}
          </p>
        )}
      </div>

      {/* AR pill button */}
      {previewMode ? (
        <span
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={arPillStyle}
        >
          <ScanSearch className="w-3 h-3" />
          Voir en AR
        </span>
      ) : (
        <Link
          href={`/c/${catalogueSlug}/ar/${item.id}`}
          onClick={() => trackCatalogueEvent(catalogueSlug, 'item_ar_open', { itemId: item.id })}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 active:scale-95"
          style={arPillStyle}
        >
          <ScanSearch className="w-3 h-3" />
          Voir en AR
        </Link>
      )}
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
