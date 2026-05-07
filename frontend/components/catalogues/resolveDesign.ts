import type { Catalogue, CatalogueDesign, FontFamily } from '@/lib/types';
import { mergeDesign } from '@/lib/types';
import { THEME_TOKENS, type ThemeTokens } from './theme';

export interface ResolvedStyles {
  /** Base palette (color classes) — derived from `theme` preset. */
  tokens:        ThemeTokens;
  /** Fully-merged design tokens (sizes, layouts, fonts). */
  design:        CatalogueDesign;
  /** Inline style for the page background (gradient or cover image). null when preset is used. */
  pageBgStyle:   React.CSSProperties | null;
  /** Inline style for the accent button (bg + text). */
  accentInline:  React.CSSProperties;
  /** CSS font-family for the title. */
  titleFont:     string;
  /** CSS font-family for the subtitle. */
  subtitleFont:  string;
}

/** Web-safe stack used as fallback while custom fonts are not loaded. */
export const FONT_STACK: Record<FontFamily, string> = {
  inter:      "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
  unna:       "var(--font-unna), Georgia, 'Times New Roman', serif",
  mono:       "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  poppins:    "Poppins, ui-sans-serif, system-ui, sans-serif",
  roboto:     "Roboto, ui-sans-serif, system-ui, sans-serif",
  montserrat: "Montserrat, ui-sans-serif, system-ui, sans-serif",
  lato:       "Lato, ui-sans-serif, system-ui, sans-serif",
  playfair:   "'Playfair Display', Georgia, serif",
  raleway:    "Raleway, ui-sans-serif, system-ui, sans-serif",
  oswald:     "Oswald, ui-sans-serif, system-ui, sans-serif",
};

/** Compute the merged styles for a catalogue, mixing preset + design tokens. */
export function resolveCatalogueStyles(catalogue: Catalogue): ResolvedStyles {
  const design = mergeDesign(catalogue.design);
  const presetKey = design.background.preset ?? catalogue.theme;
  const tokens = THEME_TOKENS[presetKey];

  let pageBgStyle: React.CSSProperties | null = null;
  if (design.background.mode === 'gradient' && design.background.gradient) {
    const { from, to, angle } = design.background.gradient;
    pageBgStyle = { background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)` };
  } else if (design.background.mode === 'cover' && design.background.cover?.url) {
    const { url, focalY } = design.background.cover;
    pageBgStyle = {
      backgroundImage:    `url(${url})`,
      backgroundSize:     'cover',
      backgroundPosition: `center ${Math.round(focalY * 100)}%`,
      backgroundRepeat:   'no-repeat',
    };
  }

  const accentInline: React.CSSProperties = {
    backgroundColor: design.accent.color,
    color:           design.accent.textColor,
  };

  return {
    tokens,
    design,
    pageBgStyle,
    accentInline,
    titleFont:    FONT_STACK[design.header.title.font],
    subtitleFont: FONT_STACK[design.header.subtitle.font],
  };
}

/** Map our `radius` token to a CSS pixel value. */
export function radiusToCss(r: 'circle' | 'rounded' | 'square'): string {
  if (r === 'circle')  return '9999px';
  if (r === 'rounded') return '20%';
  return '12%';
}

/** Map socials radius token to CSS. */
export function socialsRadiusToCss(r: 'full' | 'md' | 'lg'): string {
  if (r === 'full') return '9999px';
  if (r === 'lg')   return '1.25rem';
  return '0.75rem';
}
