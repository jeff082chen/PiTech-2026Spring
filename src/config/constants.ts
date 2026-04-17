// ─── Shared canvas dimensions ─────────────────────────────────────────────────
// Used by StoryPage (scroll-driven) and MapView (free-explore).
// Canvas is a fixed coordinate space; nodes are positioned within it.

export const CANVAS_W = 6700;
export const CANVAS_H = 4500;

// MapView uses a taller canvas to accommodate hidden node sub-trees.
// StoryPage always uses CANVAS_H (hidden nodes are filtered out).
export const MAP_CANVAS_H = 5500;

// ─── Responsive breakpoint ────────────────────────────────────────────────────
// Matches Tailwind's default `md` breakpoint.

export const MOBILE_BREAKPOINT = 768;
