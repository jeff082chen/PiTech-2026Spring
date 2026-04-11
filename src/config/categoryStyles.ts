import type { NodeCategory } from '../types';

// ─── Shared category style maps ───────────────────────────────────────────────
// Used by StoryPage and MapView. Keep in sync with NodeCategory in types.ts.

// Node card border colour (used on canvas nodes in both views)
export const BORDER_COLOR: Record<NodeCategory, string> = {
  hotline:       'border-yellow-400',
  cares:         'border-green-400',
  warning:       'border-amber-400',
  investigation: 'border-red-400',
  court:         'border-red-700',
  neutral:       'border-neutral-500',
};

// Category label text colour (used in story card and focus hint)
export const CATEGORY_LABEL: Record<NodeCategory, string> = {
  hotline:       'text-yellow-400',
  cares:         'text-green-400',
  warning:       'text-amber-400',
  investigation: 'text-red-400',
  court:         'text-red-500',
  neutral:       'text-neutral-400',
};

// Left-border accent on the story card title block
export const CATEGORY_LEFT_BORDER: Record<NodeCategory, string> = {
  hotline:       'border-yellow-400',
  cares:         'border-green-400',
  warning:       'border-amber-400',
  investigation: 'border-red-400',
  court:         'border-red-600',
  neutral:       'border-neutral-500',
};
