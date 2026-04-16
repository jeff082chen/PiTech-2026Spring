// ─── Accent colour maps ───────────────────────────────────────────────────────
// Single source of truth for AccentColor → Tailwind class conversions.
// All chart renderers import from here; never hardcode colour classes in renderers.

import type { AccentColor } from '../../types';

/** Large stat number / strong highlight text */
export const ACCENT_TEXT: Record<AccentColor, string> = {
  red:     'text-red-400',
  amber:   'text-amber-400',
  orange:  'text-orange-400',
  green:   'text-green-400',
  blue:    'text-blue-400',
  pink:    'text-pink-400',
  neutral: 'text-neutral-400',
};

/** Solid fill (bar chart bars, progress fills) */
export const ACCENT_BG: Record<AccentColor, string> = {
  red:     'bg-red-500',
  amber:   'bg-amber-500',
  orange:  'bg-orange-500',
  green:   'bg-green-500',
  blue:    'bg-blue-500',
  pink:    'bg-pink-500',
  neutral: 'bg-neutral-500',
};

/** Very subtle tinted background (card fill) */
export const ACCENT_BG_SUBTLE: Record<AccentColor, string> = {
  red:     'bg-red-950/20',
  amber:   'bg-amber-950/20',
  orange:  'bg-orange-950/20',
  green:   'bg-green-950/20',
  blue:    'bg-blue-950/20',
  pink:    'bg-pink-950/20',
  neutral: 'bg-neutral-800/40',
};

/** Card / panel border */
export const ACCENT_BORDER: Record<AccentColor, string> = {
  red:     'border-red-700/60',
  amber:   'border-amber-700/60',
  orange:  'border-orange-700/60',
  green:   'border-green-700/60',
  blue:    'border-blue-700/60',
  pink:    'border-pink-700/60',
  neutral: 'border-neutral-700/60',
};

/** Card header background (slightly more opaque than subtle) */
export const ACCENT_HEADER_BG: Record<AccentColor, string> = {
  red:     'bg-red-950/60',
  amber:   'bg-amber-950/60',
  orange:  'bg-orange-950/60',
  green:   'bg-green-950/60',
  blue:    'bg-blue-950/60',
  pink:    'bg-pink-950/60',
  neutral: 'bg-neutral-800/60',
};

/** Card header text */
export const ACCENT_HEADER_TEXT: Record<AccentColor, string> = {
  red:     'text-red-300',
  amber:   'text-amber-300',
  orange:  'text-orange-300',
  green:   'text-green-300',
  blue:    'text-blue-300',
  pink:    'text-pink-300',
  neutral: 'text-neutral-200',
};

/** Raw hex for SVG fills / inline styles */
export const ACCENT_HEX: Record<AccentColor, string> = {
  red:     '#ef4444',
  amber:   '#f59e0b',
  orange:  '#f97316',
  green:   '#22c55e',
  blue:    '#60a5fa',
  pink:    '#ec4899',
  neutral: '#737373',
};

/** Inline style background colour (pipeline bars) */
export const ACCENT_HEX_BG: Record<AccentColor, string> = {
  red:     '#dc2626',
  amber:   '#d97706',
  orange:  '#ea580c',
  green:   '#16a34a',
  blue:    '#2563eb',
  pink:    '#db2777',
  neutral: '#525252',
};
