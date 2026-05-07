'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  ScanSearch,
  Box as BoxIcon,
  Image as ImageIcon,
  ScanLine,
  Hand,
  Globe,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Music2,
  Store,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCatalogueEvent } from '@/lib/catalogueTracking';
import type { Catalogue, CatalogueDesign, CatalogueItemWithModel, CatalogueSocials } from '@/lib/types';
import { type ThemeTokens } from './theme';
import { resolveCatalogueStyles, socialsRadiusToCss, FONT_STACK } from './resolveDesign';

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

interface HorizontalCatalogueViewProps {
  catalogue:    Catalogue;
  items:        CatalogueItemWithModel[];
  previewMode?: boolean;
}

const ALL_TAB = '__all__';

export function HorizontalCatalogueView({ catalogue, items, previewMode = false }: HorizontalCatalogueViewProps) {
  const styles = resolveCatalogueStyles(catalogue);
  const { tokens: t, design, pageBgStyle, accentInline, titleFont, subtitleFont } = styles;

  // Fire `catalogue_view` once per public mount.
  useEffect(() => {
    if (previewMode) return;
    trackCatalogueEvent(catalogue.slug, 'catalogue_view');
  }, [previewMode, catalogue.slug]);

  // ── Tab state — first tab = "Tous" pseudo-tab ────────────────────────────
  const tabs = useMemo(
    () => [{ id: ALL_TAB, label: 'Tous' }, ...catalogue.categories],
    [catalogue.categories],
  );
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

  const visibleItems = useMemo(() => {
    if (activeTab === ALL_TAB) return items;
    return items.filter((it) => it.category_id === activeTab);
  }, [items, activeTab]);

  // ── Coverflow carousel ───────────────────────────────────────────────────
  // Native horizontal scroll (best touch UX) + rAF-driven 3D transforms based
  // on each card's distance from the container's center. Center card stands
  // upright at full scale; side cards shrink, tilt, and dim.
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const containerRect = el.getBoundingClientRect();
      const center        = containerRect.left + containerRect.width / 2;
      const cards         = el.querySelectorAll<HTMLElement>('[data-card]');

      cards.forEach((card) => {
        const rect       = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance   = (cardCenter - center) / containerRect.width;
        const abs        = Math.min(Math.abs(distance), 1.2);

        const scale       = 1 - 0.18 * abs;
        const rotateY     = -distance * 28;
        const translateX  = -distance * 6;
        const opacity     = Math.max(0.35, 1 - 0.4 * abs);

        card.style.transform = `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`;
        card.style.opacity   = String(opacity);
        card.style.zIndex    = String(100 - Math.round(abs * 100));
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);

    requestAnimationFrame(update);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [visibleItems.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  const showCoverBg = design.background.mode === 'cover' && !!design.background.cover?.url;

  return (
    <main
      className={cn('min-h-screen w-full relative overflow-x-hidden', !pageBgStyle && t.pageBg)}
      style={pageBgStyle ?? undefined}
    >
      {!showCoverBg && (
        <div className={cn('absolute inset-0 pointer-events-none opacity-60')}>
          <div className={cn('absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl', t.orbColor)} />
          <div className={cn('absolute -top-12 right-[-4rem] w-56 h-56 rounded-full blur-3xl', t.orbColor)} />
        </div>
      )}

      <div
        className="relative max-w-[40rem] mx-auto pb-24"
        style={{
          paddingLeft:  `${design.products.outerInset}px`,
          paddingRight: `${design.products.outerInset}px`,
          paddingTop:   `${design.header.spacing.topInset}px`,
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between mb-5">
          <div className="min-w-0 flex-1">
            <h1
              className={cn('font-bold tracking-tight', t.titleColor)}
              style={{
                fontFamily:  titleFont,
                fontSize:    `${design.header.title.size}px`,
                fontWeight:  design.header.title.weight,
                marginLeft:  `${design.header.title.marginX}px`,
              }}
            >
              {design.header.title.emoji && <span aria-hidden="true">{design.header.title.emoji} </span>}
              {catalogue.title}
            </h1>
            {design.header.subtitle.show && catalogue.subtitle && (
              <p
                className={cn('mt-1', t.bodyColor)}
                style={{
                  fontFamily:  subtitleFont,
                  fontSize:    `${design.header.subtitle.size}px`,
                  marginLeft:  `${design.header.subtitle.marginX}px`,
                }}
              >
                {catalogue.subtitle}
              </p>
            )}
            {design.header.location.show && catalogue.location && (
              <p
                className={cn('mt-1 inline-flex items-center gap-1', t.mutedColor)}
                style={{
                  fontFamily:  subtitleFont,
                  fontSize:    `${Math.max(11, design.header.subtitle.size - 2)}px`,
                  marginLeft:  `${design.header.subtitle.marginX}px`,
                }}
              >
                <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                {catalogue.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3 mr-3">
            <button
              type="button"
              aria-label="Rechercher"
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border',
                t.cardBg, t.cardBorder, t.bodyColor,
              )}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Panier"
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border',
                t.cardBg, t.cardBorder, t.bodyColor,
              )}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        {tabs.length > 1 && (
          <nav
            aria-label="Catégories"
            className="flex items-center overflow-x-auto -mx-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              marginTop:     `${design.tabs.marginTop}px`,
              marginBottom:  '16px',
              paddingLeft:   `${design.tabs.marginX}px`,
              paddingRight:  `${design.tabs.marginX}px`,
              gap:           `${design.tabs.gap}px`,
            }}
          >
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full transition-colors',
                    active
                      ? cn(!design.tabs.activeBg && t.activeTabBg, !design.tabs.activeText && t.activeTabText)
                      : cn(!design.tabs.inactiveText && t.inactiveTabText, 'hover:opacity-80'),
                  )}
                  style={{
                    fontFamily: FONT_STACK[design.tabs.font],
                    fontSize:   `${design.tabs.size}px`,
                    fontWeight: design.tabs.weight,
                    ...(active && design.tabs.activeBg   ? { backgroundColor: design.tabs.activeBg }   : {}),
                    ...(active && design.tabs.activeText ? { color: design.tabs.activeText }            : {}),
                    ...(!active && design.tabs.inactiveText ? { color: design.tabs.inactiveText }       : {}),
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* ── Carousel ────────────────────────────────────────────────────── */}
        {visibleItems.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className={cn('w-10 h-10 mx-auto mb-3 opacity-30', t.mutedColor)} />
            <p className={cn('text-sm', t.mutedColor)}>
              Aucun produit dans cette catégorie.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Coverflow scroller — native horizontal scroll + JS-driven 3D transforms */}
            <div
              ref={scrollerRef}
              className="coverflow-scroller flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 py-8 [perspective:1200px]"
              style={{
                paddingLeft:         `${(100 - design.products.cardWidth) / 2}%`,
                paddingRight:        `${(100 - design.products.cardWidth) / 2}%`,
                scrollPaddingInline: `${(100 - design.products.cardWidth) / 2}%`,
              }}
            >
              {visibleItems.map((it) => (
                <Card
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

            {/* Prev/Next buttons (desktop) */}
            <div className="absolute inset-y-0 left-0 hidden sm:flex items-center -ml-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Précédent"
                className={cn(
                  'w-9 h-9 rounded-full shadow-md border flex items-center justify-center transition-transform hover:scale-105',
                  t.cardBg, t.cardBorder, t.bodyColor,
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 hidden sm:flex items-center -mr-2">
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Suivant"
                className={cn(
                  'w-9 h-9 rounded-full shadow-md border flex items-center justify-center transition-transform hover:scale-105',
                  t.cardBg, t.cardBorder, t.bodyColor,
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Swipe hint ──────────────────────────────────────────────────── */}
        {visibleItems.length > 1 && (
          <div className={cn('flex items-center justify-center gap-3 mt-3 text-xs', t.mutedColor)}>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="inline-flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Glissez pour explorer
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}

        {/* ── Socials at the bottom ───────────────────────────────────────── */}
        {(() => {
          const hiddenSocials = new Set<keyof CatalogueSocials>(design.socials.hidden ?? []);
          const visibleSocials = SOCIAL_ORDER.filter((k) => !hiddenSocials.has(k));
          const socialsRadius = socialsRadiusToCss(design.socials.radius);
          const socialsAlignJustify =
            design.socials.align === 'left'  ? 'justify-start' :
            design.socials.align === 'right' ? 'justify-end' :
                                               'justify-center';
          if (!design.socials.show || visibleSocials.length === 0) return null;
          return (
            <div className="overflow-x-auto mt-10 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <nav
                aria-label="Liens sociaux"
                className={cn('flex w-max mx-auto min-w-full px-1', socialsAlignJustify)}
                style={{ gap: `${design.socials.gap}px` }}
              >
                {visibleSocials.map((key) => {
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
          );
        })()}

        {/* ── Footer credit ──────────────────────────────────────────────── */}
        <footer className="text-center mt-12">
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

// ─── Carousel card ────────────────────────────────────────────────────────────
function Card({
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

  return (
    <article
      data-card
      className={cn(
        'snap-center shrink-0 max-w-md',
        'border overflow-hidden flex flex-col',
        '[transform-origin:center_center] [will-change:transform,opacity]',
        '[backface-visibility:hidden]',
        t.glassCard,
        t.cardBorder,
      )}
      style={{
        flexBasis:    `${design.products.cardWidth}%`,
        height:       `${design.products.cardHeight}px`,
        borderRadius: `${design.products.radius + 8}px`,
        boxShadow:    `0 30px 60px -15px rgba(0,0,0,0.25), 0 8px 20px -8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      {/* Image area */}
      <div
        className="relative bg-gray-100 shrink-0"
        style={{ height: `${design.products.imageHeight}px` }}
      >
        {item.model.image_url ? (
          <Image
            src={item.model.image_url}
            alt={label}
            fill
            sizes="(max-width: 640px) 90vw, 400px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BoxIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}

        {/* Badge top-left */}
        {item.badge && (
          <span className={cn(
            'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold',
            t.badgeBg, t.badgeText,
          )}>
            {item.badge}
          </span>
        )}

        {/* Heart icon */}
        <button
          type="button"
          aria-label="Mettre en favori"
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-white/80 backdrop-blur text-gray-700 hover:text-red-500 transition-colors',
          )}
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1">
        <h3
          className={cn('font-semibold leading-snug mb-0.5 truncate', t.titleColor)}
          style={{ fontSize: `${design.products.titleSize}px` }}
        >
          {label}
        </h3>
        {description && (
          <p
            className={cn('leading-snug line-clamp-2 mb-2', t.mutedColor)}
            style={{ fontSize: `${design.products.descSize}px` }}
          >
            {description}
          </p>
        )}
        {item.price && (
          <p
            className={cn('font-semibold mb-2.5', t.titleColor)}
            style={{ fontSize: `${design.products.priceSize}px` }}
          >
            {item.price}
          </p>
        )}

        {previewMode ? (
          <span
            className="mt-auto inline-flex items-center justify-center gap-1 w-full h-9 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap"
            style={accentInline}
          >
            <ScanSearch className="w-3.5 h-3.5" />
            Voir en AR
          </span>
        ) : (
          <Link
            href={`/c/${catalogueSlug}/ar/${item.id}`}
            onClick={() => trackCatalogueEvent(catalogueSlug, 'item_ar_open', { itemId: item.id })}
            style={accentInline}
            className="mt-auto inline-flex items-center justify-center gap-1 w-full h-9 rounded-full text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            Voir en AR
          </Link>
        )}
      </div>
    </article>
  );
}
