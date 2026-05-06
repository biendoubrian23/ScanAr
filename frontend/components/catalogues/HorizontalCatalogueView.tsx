'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCatalogueEvent } from '@/lib/catalogueTracking';
import type { Catalogue, CatalogueItemWithModel } from '@/lib/types';
import { THEME_TOKENS, type ThemeTokens } from './theme';
import { PublicStatsPanel } from './PublicStatsPanel';

interface HorizontalCatalogueViewProps {
  catalogue:    Catalogue;
  items:        CatalogueItemWithModel[];
  previewMode?: boolean;
}

const ALL_TAB = '__all__';

export function HorizontalCatalogueView({ catalogue, items, previewMode = false }: HorizontalCatalogueViewProps) {
  const t = THEME_TOKENS[catalogue.theme];

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

  return (
    <main className={cn('min-h-screen w-full relative overflow-x-hidden', t.pageBg)}>
      <div className={cn('absolute inset-0 pointer-events-none opacity-60')}>
        <div className={cn('absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl', t.orbColor)} />
        <div className={cn('absolute -top-12 right-[-4rem] w-56 h-56 rounded-full blur-3xl', t.orbColor)} />
      </div>

      <div className="relative max-w-[40rem] mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between mb-5">
          <div className="min-w-0">
            <h1 className={cn('text-3xl font-bold tracking-tight', t.titleColor)}>
              {catalogue.title}
            </h1>
            {catalogue.subtitle && (
              <p className={cn('text-sm mt-1', t.bodyColor)}>{catalogue.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
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
            className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-thin"
          >
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    active
                      ? cn(t.activeTabBg, t.activeTabText)
                      : cn(t.inactiveTabText, 'hover:opacity-80'),
                  )}
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
              className={cn(
                'coverflow-scroller flex gap-3 overflow-x-auto snap-x snap-mandatory',
                'scrollbar-none -mx-4 px-[15%] py-8',
                '[scroll-padding-inline:15%] [perspective:1200px]',
              )}
            >
              {visibleItems.map((it) => (
                <Card key={it.id} catalogueSlug={catalogue.slug} item={it} tokens={t} previewMode={previewMode} />
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

        {/* ── Optional configurable stats panel (owner-controlled) ───────── */}
        <PublicStatsPanel catalogue={catalogue} items={items} tokens={t} />

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

  return (
    <article
      data-card
      className={cn(
        'snap-center shrink-0 basis-[70%] sm:basis-[60%] md:basis-[52%] max-w-md',
        'rounded-3xl border shadow-xl overflow-hidden flex flex-col',
        '[transform-origin:center_center] [will-change:transform,opacity]',
        '[backface-visibility:hidden]',
        t.cardBg,
        t.cardBorder,
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] bg-gray-100">
        {item.model.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.model.image_url}
            alt={label}
            className="w-full h-full object-cover"
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
      <div className="p-4 flex flex-col flex-1">
        <h3 className={cn('text-base font-semibold leading-snug mb-0.5', t.titleColor)}>
          {label}
        </h3>
        {description && (
          <p className={cn('text-xs line-clamp-2 mb-2', t.mutedColor)}>{description}</p>
        )}
        {item.price && (
          <p className={cn('text-base font-semibold mb-3', t.titleColor)}>{item.price}</p>
        )}

        {previewMode ? (
          <span
            className={cn(
              'mt-auto inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-full text-sm font-semibold shadow-sm',
              t.accent,
              t.accentText,
            )}
          >
            <ScanSearch className="w-4 h-4" />
            Voir en AR
          </span>
        ) : (
          <Link
            href={`/c/${catalogueSlug}/ar/${item.id}`}
            onClick={() => trackCatalogueEvent(catalogueSlug, 'item_ar_open', { itemId: item.id })}
            className={cn(
              'mt-auto inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-full text-sm font-semibold shadow-sm transition-all',
              t.accent,
              t.accentText,
            )}
          >
            <ScanSearch className="w-4 h-4" />
            Voir en AR
          </Link>
        )}
      </div>
    </article>
  );
}
