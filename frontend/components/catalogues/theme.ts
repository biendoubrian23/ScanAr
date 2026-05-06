import type { CatalogueTheme } from '@/lib/types';

/**
 * Per-theme styling tokens for the public catalogue viewers.
 * Both vertical (linktree) and horizontal (carousel) layouts read from this
 * map so a theme switch from the editor is reflected everywhere.
 */
export interface ThemeTokens {
  /** Outer page background — visible behind the centered phone-width column */
  pageBg:        string;
  /** The catalogue surface (the `phone` width column where content lives)  */
  surfaceBg:     string;
  /** Headline / title color */
  titleColor:    string;
  /** Body / paragraph color */
  bodyColor:     string;
  /** Muted color (subtitles, captions, footnotes) */
  mutedColor:    string;
  /** Card background for product items */
  cardBg:        string;
  /** Card border */
  cardBorder:    string;
  /** Accent color for CTAs and highlights */
  accent:        string;
  /** Accent text color (when on a colored bg) */
  accentText:    string;
  /** "View in AR" button bg */
  arButtonBg:    string;
  /** "View in AR" button text color */
  arButtonText:  string;
  /** Active tab pill bg */
  activeTabBg:   string;
  /** Active tab pill text */
  activeTabText: string;
  /** Inactive tab text */
  inactiveTabText: string;
  /** Badge bg (e.g. "In Your Space") */
  badgeBg:       string;
  /** Badge text */
  badgeText:     string;
  /** Decorative orb glow color (top-of-page ambient) */
  orbColor:      string;
}

export const THEME_TOKENS: Record<CatalogueTheme, ThemeTokens> = {
  pink: {
    pageBg:          'bg-gradient-to-b from-pink-100 via-fuchsia-50 to-purple-100',
    surfaceBg:       'bg-gradient-to-b from-pink-50/80 to-fuchsia-50/60',
    titleColor:      'text-purple-950',
    bodyColor:       'text-purple-900/80',
    mutedColor:      'text-purple-700/60',
    cardBg:          'bg-white/70 backdrop-blur',
    cardBorder:      'border-pink-200/60',
    accent:          'bg-fuchsia-300 hover:bg-fuchsia-400',
    accentText:      'text-purple-900',
    arButtonBg:      'bg-purple-300/90 hover:bg-purple-400',
    arButtonText:    'text-purple-950',
    activeTabBg:     'bg-purple-300',
    activeTabText:   'text-purple-950',
    inactiveTabText: 'text-purple-700/70',
    badgeBg:         'bg-purple-200/80',
    badgeText:       'text-purple-900',
    orbColor:        'bg-fuchsia-300/40',
  },
  beige: {
    pageBg:          'bg-gradient-to-b from-stone-100 via-amber-50 to-orange-50',
    surfaceBg:       'bg-white',
    titleColor:      'text-stone-900',
    bodyColor:       'text-stone-700',
    mutedColor:      'text-stone-500',
    cardBg:          'bg-white',
    cardBorder:      'border-stone-200',
    accent:          'bg-amber-700 hover:bg-amber-800',
    accentText:      'text-white',
    arButtonBg:      'bg-amber-500/90 hover:bg-amber-600',
    arButtonText:    'text-white',
    activeTabBg:     'bg-stone-900',
    activeTabText:   'text-white',
    inactiveTabText: 'text-stone-500',
    badgeBg:         'bg-stone-100',
    badgeText:       'text-stone-700',
    orbColor:        'bg-amber-200/40',
  },
  indigo: {
    pageBg:          'bg-gradient-to-b from-indigo-100 via-blue-50 to-purple-100',
    surfaceBg:       'bg-gradient-to-b from-white to-indigo-50/50',
    titleColor:      'text-indigo-950',
    bodyColor:       'text-gray-700',
    mutedColor:      'text-gray-500',
    cardBg:          'bg-white',
    cardBorder:      'border-indigo-100',
    accent:          'bg-indigo-600 hover:bg-indigo-700',
    accentText:      'text-white',
    arButtonBg:      'bg-indigo-100 hover:bg-indigo-200',
    arButtonText:    'text-indigo-700',
    activeTabBg:     'bg-indigo-600',
    activeTabText:   'text-white',
    inactiveTabText: 'text-gray-500',
    badgeBg:         'bg-indigo-50',
    badgeText:       'text-indigo-700',
    orbColor:        'bg-indigo-300/40',
  },
  dark: {
    pageBg:          'bg-zinc-950',
    surfaceBg:       'bg-zinc-900',
    titleColor:      'text-zinc-100',
    bodyColor:       'text-zinc-300',
    mutedColor:      'text-zinc-500',
    cardBg:          'bg-zinc-800/70 backdrop-blur',
    cardBorder:      'border-zinc-700/60',
    accent:          'bg-white hover:bg-zinc-200',
    accentText:      'text-zinc-900',
    arButtonBg:      'bg-zinc-700 hover:bg-zinc-600',
    arButtonText:    'text-white',
    activeTabBg:     'bg-white',
    activeTabText:   'text-zinc-900',
    inactiveTabText: 'text-zinc-400',
    badgeBg:         'bg-zinc-800',
    badgeText:       'text-zinc-300',
    orbColor:        'bg-indigo-500/20',
  },
  minimal: {
    pageBg:          'bg-gray-50',
    surfaceBg:       'bg-white',
    titleColor:      'text-gray-900',
    bodyColor:       'text-gray-700',
    mutedColor:      'text-gray-500',
    cardBg:          'bg-white',
    cardBorder:      'border-gray-200',
    accent:          'bg-gray-900 hover:bg-gray-800',
    accentText:      'text-white',
    arButtonBg:      'bg-gray-100 hover:bg-gray-200',
    arButtonText:    'text-gray-900',
    activeTabBg:     'bg-gray-900',
    activeTabText:   'text-white',
    inactiveTabText: 'text-gray-500',
    badgeBg:         'bg-gray-100',
    badgeText:       'text-gray-700',
    orbColor:        'bg-gray-200/60',
  },
};
