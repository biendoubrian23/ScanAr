import type { CatalogueTheme } from '@/lib/types';

export interface ThemeTokens {
  pageBg:              string;
  surfaceBg:           string;
  titleColor:          string;
  bodyColor:           string;
  mutedColor:          string;
  cardBg:              string;
  cardBorder:          string;
  accent:              string;
  accentText:          string;
  arButtonBg:          string;
  arButtonText:        string;
  activeTabBg:         string;
  activeTabText:       string;
  inactiveTabText:     string;
  badgeBg:             string;
  badgeText:           string;
  orbColor:            string;
  /** CSS box-shadow for neumorphic social link buttons */
  neuShadow:           string;
  /** Tailwind bg class for social link button background */
  socialBtnBg:         string;
  /** Tailwind classes for the outer glass card surface */
  glassCard:           string;
  /** CSS rgba value for the glass AR pill button background */
  glassArBg:           string;
  /** CSS rgba value for the glass AR pill button border */
  glassArBorder:       string;
  /** CSS rgba value for each product mini-card background */
  miniCardGlassBg:     string;
  /** CSS rgba value for each product mini-card border */
  miniCardGlassBorder: string;
  /** CSS box-shadow for each product mini-card (neumorphic double shadow) */
  miniCardNeuShadow:   string;
}

export const THEME_TOKENS: Record<CatalogueTheme, ThemeTokens> = {
  pink: {
    pageBg:              'bg-gradient-to-b from-pink-100 via-fuchsia-50 to-purple-100',
    surfaceBg:           'bg-gradient-to-b from-pink-50/80 to-fuchsia-50/60',
    titleColor:          'text-purple-950',
    bodyColor:           'text-purple-900/80',
    mutedColor:          'text-purple-700/60',
    cardBg:              'bg-white/70 backdrop-blur',
    cardBorder:          'border-pink-200/60',
    accent:              'bg-fuchsia-300 hover:bg-fuchsia-400',
    accentText:          'text-purple-900',
    arButtonBg:          'bg-purple-300/90 hover:bg-purple-400',
    arButtonText:        'text-purple-950',
    activeTabBg:         'bg-purple-300',
    activeTabText:       'text-purple-950',
    inactiveTabText:     'text-purple-700/70',
    badgeBg:             'bg-purple-200/80',
    badgeText:           'text-purple-900',
    orbColor:            'bg-fuchsia-300/40',
    neuShadow:           '5px 5px 12px rgba(200,100,200,0.15), -4px -4px 10px rgba(255,255,255,0.85)',
    socialBtnBg:         'bg-pink-50',
    glassCard:           'bg-white/45 backdrop-blur-xl',
    glassArBg:           'rgba(216,180,254,0.4)',
    glassArBorder:       'rgba(255,255,255,0.3)',
    miniCardGlassBg:     'rgba(255,245,255,0.75)',
    miniCardGlassBorder: 'rgba(200,100,200,0.04)',
    miniCardNeuShadow:   '0 2px 8px rgba(200,100,200,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  beige: {
    pageBg:              'bg-gradient-to-b from-stone-100 via-amber-50 to-orange-50',
    surfaceBg:           'bg-white',
    titleColor:          'text-stone-900',
    bodyColor:           'text-stone-700',
    mutedColor:          'text-stone-500',
    cardBg:              'bg-white',
    cardBorder:          'border-stone-200',
    accent:              'bg-amber-700 hover:bg-amber-800',
    accentText:          'text-white',
    arButtonBg:          'bg-amber-500/90 hover:bg-amber-600',
    arButtonText:        'text-amber-900',
    activeTabBg:         'bg-stone-900',
    activeTabText:       'text-white',
    inactiveTabText:     'text-stone-500',
    badgeBg:             'bg-stone-100',
    badgeText:           'text-stone-700',
    orbColor:            'bg-amber-200/40',
    neuShadow:           '5px 5px 12px rgba(140,120,80,0.15), -4px -4px 10px rgba(255,255,255,0.9)',
    socialBtnBg:         'bg-stone-50',
    glassCard:           'bg-white/55 backdrop-blur-xl',
    glassArBg:           'rgba(245,158,11,0.25)',
    glassArBorder:       'rgba(245,158,11,0.25)',
    miniCardGlassBg:     'rgba(255,252,245,0.78)',
    miniCardGlassBorder: 'rgba(140,120,80,0.04)',
    miniCardNeuShadow:   '0 2px 8px rgba(140,120,80,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
  },
  indigo: {
    pageBg:              'bg-gradient-to-b from-indigo-100 via-blue-50 to-purple-100',
    surfaceBg:           'bg-gradient-to-b from-white to-indigo-50/50',
    titleColor:          'text-indigo-950',
    bodyColor:           'text-gray-700',
    mutedColor:          'text-gray-500',
    cardBg:              'bg-white',
    cardBorder:          'border-indigo-100',
    accent:              'bg-indigo-600 hover:bg-indigo-700',
    accentText:          'text-white',
    arButtonBg:          'bg-indigo-100 hover:bg-indigo-200',
    arButtonText:        'text-indigo-700',
    activeTabBg:         'bg-indigo-600',
    activeTabText:       'text-white',
    inactiveTabText:     'text-gray-500',
    badgeBg:             'bg-indigo-50',
    badgeText:           'text-indigo-700',
    orbColor:            'bg-indigo-300/40',
    neuShadow:           '5px 5px 12px rgba(80,80,220,0.12), -4px -4px 10px rgba(255,255,255,0.85)',
    socialBtnBg:         'bg-indigo-50',
    glassCard:           'bg-white/55 backdrop-blur-xl',
    glassArBg:           'rgba(199,210,254,0.45)',
    glassArBorder:       'rgba(199,210,254,0.35)',
    miniCardGlassBg:     'rgba(245,247,255,0.78)',
    miniCardGlassBorder: 'rgba(80,80,200,0.04)',
    miniCardNeuShadow:   '0 2px 8px rgba(80,80,200,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
  },
  dark: {
    pageBg:              'bg-zinc-950',
    surfaceBg:           'bg-zinc-900',
    titleColor:          'text-zinc-100',
    bodyColor:           'text-zinc-300',
    mutedColor:          'text-zinc-500',
    cardBg:              'bg-zinc-800/70 backdrop-blur',
    cardBorder:          'border-zinc-700/60',
    accent:              'bg-white hover:bg-zinc-200',
    accentText:          'text-zinc-900',
    arButtonBg:          'bg-zinc-700 hover:bg-zinc-600',
    arButtonText:        'text-zinc-100',
    activeTabBg:         'bg-white',
    activeTabText:       'text-zinc-900',
    inactiveTabText:     'text-zinc-400',
    badgeBg:             'bg-zinc-800',
    badgeText:           'text-zinc-300',
    orbColor:            'bg-indigo-500/20',
    neuShadow:           '5px 5px 12px rgba(0,0,0,0.55), -2px -2px 8px rgba(80,80,110,0.2)',
    socialBtnBg:         'bg-zinc-800',
    glassCard:           'bg-zinc-800/55 backdrop-blur-xl',
    glassArBg:           'rgba(50,50,80,0.65)',
    glassArBorder:       'rgba(255,255,255,0.06)',
    miniCardGlassBg:     'rgba(20,20,40,0.82)',
    miniCardGlassBorder: 'rgba(255,255,255,0.04)',
    miniCardNeuShadow:   '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  minimal: {
    pageBg:              'bg-gray-50',
    surfaceBg:           'bg-white',
    titleColor:          'text-gray-900',
    bodyColor:           'text-gray-700',
    mutedColor:          'text-gray-500',
    cardBg:              'bg-white',
    cardBorder:          'border-gray-200',
    accent:              'bg-gray-900 hover:bg-gray-800',
    accentText:          'text-white',
    arButtonBg:          'bg-gray-100 hover:bg-gray-200',
    arButtonText:        'text-gray-900',
    activeTabBg:         'bg-gray-900',
    activeTabText:       'text-white',
    inactiveTabText:     'text-gray-500',
    badgeBg:             'bg-gray-100',
    badgeText:           'text-gray-700',
    orbColor:            'bg-gray-200/60',
    neuShadow:           '5px 5px 12px rgba(0,0,0,0.1), -4px -4px 10px rgba(255,255,255,0.95)',
    socialBtnBg:         'bg-gray-50',
    glassCard:           'bg-white/55 backdrop-blur-xl',
    glassArBg:           'rgba(255,255,255,0.45)',
    glassArBorder:       'rgba(0,0,0,0.06)',
    miniCardGlassBg:     'rgba(250,250,252,0.82)',
    miniCardGlassBorder: 'rgba(0,0,0,0.03)',
    miniCardNeuShadow:   '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
  },
};
