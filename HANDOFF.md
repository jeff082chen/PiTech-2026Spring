# Developer Handoff — The Family Policing Machine

**Client:** The Bronx Defenders × Cornell Tech PiTech Studio
**Type:** Scrollytelling web experience (static SPA)
**Purpose:** Guide visitors through the real journey of a family pulled into NYC's child protective services system — a cinematic scroll-driven narrative over a live system flowchart, with data visualizations from public records.

---

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Project structure](#2-project-structure)
3. [How the scroll experience works](#3-how-the-scroll-experience-works)
4. [SCROLL_CONFIG reference](#4-scroll_config-reference)
5. [Data architecture](#5-data-architecture)
6. [The free-explore map (MapView)](#6-the-free-explore-map-mapview)
7. [Shared config files](#7-shared-config-files)
8. [Common editing tasks](#8-common-editing-tasks)
9. [Key architectural decisions](#9-key-architectural-decisions)
10. [Known issues & next steps](#10-known-issues--next-steps)

---

## 1. Getting started

**Requirements:** Node.js 18+, npm

```bash
npm install
npm run dev        # dev server → http://localhost:5173 (hot reload)
npm run build      # TypeScript check + production build → dist/
npm run preview    # serve dist/ locally for QA
```

### Deploying

The `dist/` folder is a fully static site — drop it anywhere.

| Platform | Config needed |
|----------|--------------|
| Vercel / Netlify | None — auto-detected |
| GitHub Pages | `VITE_BASE_URL=/{repo-name}/ npm run build` |

The `VITE_BASE_URL` env var is read by `vite.config.ts` and sets the asset base path.

---

## 2. Project structure

```
src/
├── App.tsx                  Top-level view router — 'story' | 'map'
├── main.tsx                 React entry point
├── index.css                Tailwind directives only
├── types.ts                 All shared TypeScript interfaces
│
├── config/
│   ├── constants.ts         CANVAS_W/H, MOBILE_BREAKPOINT — shared by both views
│   └── categoryStyles.ts    Tailwind class maps keyed by NodeCategory
│
├── components/
│   ├── StoryPage.tsx        Scroll-driven narrative (primary view)  ~600 lines
│   └── MapView.tsx          Free-explore click map (secondary view) ~350 lines
│
└── data/
    ├── storyNodes.tsx       15-node system graph + EDGES
    ├── statistics.tsx       Visual stat components for nodes
    └── mariaStory.ts        Maria's narrative config (path + story text)
```

### View routing

`App.tsx` holds a single `currentView: 'story' | 'map'` state — no routing library needed.

```
default            → <StoryPage storyConfig={MARIA_STORY} onExploreMap={...} />
"Explore Full Map" → <MapView onBackToLanding={...} />
"Home"             → back to StoryPage
```

To add a story selector, add state to `App.tsx` and pass the chosen `StoryConfig` to `<StoryPage>`. No component changes needed.

---

## 3. How the scroll experience works

### The sticky-container pattern

The page has two layers:

1. **Outer div** — `height: totalHeight` — an invisible tall container that holds all the scroll distance.
2. **Inner div** — `position: sticky; top: 0; height: 100vh` — the actual viewport that never scrolls, only its children change.

Scroll position (`window.scrollY`) is read by a `requestAnimationFrame`-throttled listener and stored as state. Everything visible is a pure function of that single number.

### Phase system

`buildPhases(storyConfig, vh)` converts the story config into a flat list of **phases** — discrete scroll segments. Each phase has:

```ts
type Phase = {
  startY:   number;    // scroll position where this phase begins
  height:   number;    // scroll distance this phase occupies
  camStart: CameraKF;  // camera keyframe at the start of this phase
  camEnd:   CameraKF;  // camera keyframe at the end of this phase
} & (
  | { type: 'hero' }
  | { type: 'overview' }
  | { type: 'node-focus'; nodeId: string }
  | { type: 'node-story'; nodeId: string }
  | { type: 'node-stat';  nodeId: string; statIndex: number }
  | { type: 'ending' }
)
```

**Phase sequence for a node with 2 statistics:**
```
node-focus  → camera zooms from previous position to this node
node-story  → camera stays on node; story card appears
node-stat   → camera stays; story card slides left; stat 0 appears (scroll-driven)
node-stat   → camera stays; stat 1 appears (scroll-driven)
```

Phases are built once per `storyConfig` + `vh` (viewport height) and memoized. Phase heights are `phaseHeights[type] × vh` — so on a taller screen each phase uses more physical scroll distance, keeping the visual pace consistent.

**Finding the active phase:** A simple linear scan finds the last phase whose `startY ≤ scrollY`. For the current phase, `t = (scrollY - phase.startY) / phase.height` gives progress `[0, 1]` within the phase. `te = easeInOut(t)` smooths it for camera and stat animations.

### Camera system

The flowchart canvas is a `6700 × 4500 px` div with `transform-origin: top left`. The camera is a CSS `transform: translate(tx, ty) scale(s)` applied to that div.

Each phase has `camStart` and `camEnd` — `CameraKF` objects (`nodeId + scale`). A keyframe is resolved to `{tx, ty, scale}` by `resolveCam()`:

- `nodeId: null` or `scale: 0` → **overview**: scales the canvas to fit the viewport at `overviewFit` (88%), centered.
- `nodeId: 'foo', scale: 0.48` → **node focus**: translates so node `foo`'s `(x, y)` is at viewport centre.

The camera transform is calculated as `lerp(resolveCam(camStart), resolveCam(camEnd), te)` — a smooth interpolation driven by scroll, with **no CSS transition on the canvas**. This is intentional: a CSS transition would fight the user's scroll speed; a lerp driven by `scrollY` stays in lock-step with the user.

### The 8-layer render stack

Inside the sticky viewport, layers are stacked with `position: absolute`:

| Layer | Content | Controlled by |
|-------|---------|---------------|
| 1 | Flowchart canvas (nodes + SVG edges) | `cameraTransform` (scroll-driven) |
| 2 | Dark overlay | `overlayOpacity` (per-phase value, CSS transition) |
| 3 | Hero screen | `phaseType === 'hero'` opacity |
| 4 | Overview label | `phaseType === 'overview'` opacity |
| 5 | Node-focus hint | `showFocusHint` (delayed via `setTimeout`) |
| 6 | Story card + stat panel | `showContent` opacity wrapper |
| 7 | Ending screen | `phaseType === 'ending'` opacity |
| 8 | Nav + progress bar | Always visible, `z-50` |

### Story card layout

The story card has a fixed width (`min(540px, 46vw)` on desktop, `90vw` on mobile) — only its `left` position changes, preventing text reflow during transitions.

```
node-story phase:  card centered  →  (vw − cardWidth) / 2
node-stat phase:   card left      →  vw × 0.03  (CSS transition: cardSlide)
```

The stat panel occupies the right half (`left: 50% + 16px`, `width: 44vw`).

### Stat panel animation (scroll-driven)

Unlike the story card (which uses CSS `transition: left`), the stat panel is **fully scroll-driven** — no CSS transitions. Each `node-stat` phase drives the stat's `translateY` and `opacity` directly from `t`:

```
t: 0 → 0.25   Entrance — slides up from +64px, fades in    (easeInOut)
t: 0.25→ 0.75 Hold     — fully visible, no motion
t: 0.75→ 1.0  Exit     — slides further up to −32px, fades out (easeInOut)
```

When the user scrolls from stat[i] to stat[i+1]: stat[i] exits upward while stat[i+1] enters from below — creating a continuous vertical-scroll rhythm. All offsets and zone boundaries are in `SCROLL_CONFIG.statAnim`.

---

## 4. SCROLL_CONFIG reference

All tuning parameters for the scroll experience live at the top of `StoryPage.tsx`. The dev server hot-reloads on every save.

```ts
const SCROLL_CONFIG = {

  // ── Phase heights ────────────────────────────────────────────────────────
  // Each value is multiplied by the viewport height to get the actual
  // scroll distance for that phase. Larger = slower feel.
  phaseHeights: {
    hero:     1.5,   // opening title screen
    overview: 1.0,   // full-map overview before diving in
    focus:    1.0,   // camera zooms to a node
    story:    1.2,   // story card is visible
    stat:     1.0,   // one stat panel (repeated per statistic)
    ending:   1.2,   // end screen
  },

  // ── Camera ───────────────────────────────────────────────────────────────
  cam: {
    overviewFit: 0.88,  // how much of the viewport the full canvas fills
    focusScale:  0.48,  // canvas scale when entering a node (focus phase)
    storyScale:  0.60,  // canvas scale when the story card is visible
  },

  // ── Dark overlay ─────────────────────────────────────────────────────────
  // Values are CSS opacity (0 = canvas fully visible, 1 = fully black).
  overlay: {
    hero:       0.92,
    overview:   0.06,
    focusStart: 0.12,   // lerps from focusStart → focusEnd across the focus phase
    focusEnd:   0.55,
    story:      0.82,
    stat:       0.80,
    ending:     0.95,
  },

  // ── CSS transitions (for non-scroll-driven UI elements) ──────────────────
  // The canvas camera does NOT use these — it is always scroll-driven.
  transitions: {
    overlay:     '600ms ease',
    screenFade:  '600ms ease',                   // hero/overview/ending fade
    focusHint:   '400ms ease',                   // node title hint at bottom
    cardSlide:   '500ms cubic-bezier(0.25,1,0.5,1)', // story card slides left
    progressBar: '500ms ease-out',
  },

  // ── Layout ───────────────────────────────────────────────────────────────
  // All fractions are relative to viewport width (vw).
  layout: {
    cardMaxPx:         540,    // max story card width (px, desktop only)
    cardFraction:      0.46,   // story card width (fraction of vw, desktop)
    cardMobileFrac:    0.9,    // story card width (fraction of vw, mobile)
    statFraction:      0.44,   // stat panel width (fraction of vw, desktop)
    statMobileFrac:    0.9,    // stat panel width (fraction of vw, mobile)
    cardStatLeftFrac:  0.03,   // card's left edge when stat panel is visible
    statPanelLeftFrac: 0.50,   // stat panel's left edge
    statPanelGapPx:    16,     // extra gap (px) added to stat panel left edge
  },

  // ── Scroll-driven stat animation ─────────────────────────────────────────
  // Controls the vertical entrance/exit of each stat panel.
  statAnim: {
    enterZone:     0.25,  // fraction of stat phase used for entrance
    exitZone:      0.75,  // fraction of stat phase at which exit begins
    enterOffsetPx: 64,    // translateY start (px, positive = below resting pos)
    exitOffsetPx:  32,    // translateY end   (px, positive = above resting pos)
  },

  focusHintDelayMs: 150,  // ms before the node title hint appears (avoids flash)
}
```

---

## 5. Data architecture

Three layers, each independent:

```
storyNodes.tsx      ← System graph  (shared by both views, all stories)
    └─ statistics.tsx ← Stat components (attached to graph nodes)
mariaStory.ts       ← Narrative config (one per character, no JSX)
```

### Layer 1 — System graph (`src/data/storyNodes.tsx`)

Defines the 15 nodes of the family policing flowchart and the 15 directed edges between them.

**Exports:**
- `STORY_NODES` (default) — `Record<string, StoryNode>`
- `EDGES` (named) — `Edge[]`

**`StoryNode` schema:**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | Unique key — must match the object key |
| `title` | `string` | Node headline shown in both views |
| `description` | `string` | Institutional explanation (system-level, not personal) |
| `icon` | `ReactElement` | lucide-react icon (sized `w-8 h-8 md:w-12 md:h-12`) |
| `x`, `y` | `number` | Node centre position on the 6700×4500 canvas |
| `category` | `NodeCategory` | Controls border colour in both views |
| `statistics?` | `NodeStatistic[]` | Zero or more stat components; each = one scroll phase |
| `choices` | `Choice[]` | Forward edges; empty array = terminal node |

**Canvas coordinate layout:**

```
y ≈ 600–900   Better-outcome branches (screened out, CARES, unsubstantiated)
y ≈ 1100      Supervision endpoint
y ≈ 2000      Main spine: start → SCR → safety assessment → investigation → court
y ≈ 2950–3550 Removal branches: foster care → kinship / group home
```

X spacing is ~650 px per depth column.

**`EDGES` sync rule:** Every `nextNodeId` in a `choices` array must have a corresponding entry in `EDGES`. `EDGES` is used to draw SVG bezier curves in both views and to compute reverse traversal in `MapView`. There is no runtime validation — a mismatch silently drops an edge line.

### Layer 2 — Statistics (`src/data/statistics.tsx`)

React components that visualise system data (charts, counters, bar charts). Assigned to nodes via the `statistics` field in `storyNodes.tsx`.

**`NodeStatistic` schema:**

```ts
interface NodeStatistic {
  id:        string;          // unique within this node
  component: ReactElement;    // the visual — a full React component
  sources:   Source[];        // citations: { label: string; url?: string }
}
```

- Each `NodeStatistic` becomes **one `node-stat` scroll phase** in `StoryPage`.
- A node with 3 statistics generates 3 consecutive stat phases.
- Statistics are **not shown** in `MapView`.
- Stats are pure display — they receive no props and manage no state.

**How to add a stat:** Write a new component, add it to the relevant `*_STATISTICS` array in `statistics.tsx`, and import/assign it to the node in `storyNodes.tsx`. It will appear automatically.

### Layer 3 — Narrative config (`src/data/mariaStory.ts`)

One file per character. **No JSX, no React imports** — fully JSON-serializable.

**`StoryConfig` schema:**

```ts
interface StoryConfig {
  id:        string;               // 'maria', 'jose', etc.
  title:     string;
  character: {
    name:       string;            // hero headline on the opening screen
    summary:    string;            // 1–2 sentence intro
    heroImage?: string;            // optional portrait URL
  };
  intro: {
    title:       string;           // shown in the overview phase label
    description: string;           // shown below summary on hero screen
  };
  path: string[];                  // ordered node IDs for this character's journey
  nodeContent: Record<string, {    // story text per node
    blocks: StoryContentBlock[];
  }>;
  ending?: {
    title:       string;
    description: string;
    actions?:    string[];         // call-to-action bullets (optional)
  };
}
```

**Content block types:**

| Type | Required fields | Optional fields | Renders as |
|------|----------------|-----------------|------------|
| `text` | `body` | `title` | Paragraph with optional bold heading |
| `quote` | `text` | `attribution` | Italic pull-quote with red left border |
| `callout` | `text` | — | Amber-bordered box |
| `image` | `src` | `caption`, `alt` | Full-width image (empty `src` shows placeholder) |

---

## 6. The free-explore map (MapView)

`MapView` uses the same `STORY_NODES` and `EDGES` data but works differently — it's a click-to-explore interface with no scroll or phases.

### State

| Variable | Type | Purpose |
|----------|------|---------|
| `activeNodeId` | `string \| null` | `null` = overview; set = zoomed to node |
| `showOverlay` | `boolean` | Shows the three-panel detail card |
| `history` | `string[]` | Ordered list of previously visited node IDs |
| `showHistoryDropdown` | `boolean` | History dropdown visibility |
| `viewport` | `{ w, h }` | Window dimensions (updated on resize) |

### Camera

The camera is a CSS `transition-transform duration-1000 cubic-bezier(0.25,1,0.5,1)` — unlike `StoryPage`, `MapView` uses CSS transitions because the transitions are triggered by click events, not scroll position.

- **Overview** (`activeNodeId === null`): canvas scaled to fill 90% of viewport, centered.
- **Focused** (`activeNodeId` set): canvas translated so the selected node is at viewport centre. Scale: `1` desktop, `0.7` mobile.

### Three-panel overlay

When a node is active, a full-screen overlay appears with three panels:

- **Left wing** — "Possible Previous Steps": nodes computed by filtering `EDGES` where `edge.to === activeNodeId` (reverse traversal via `useMemo → incomingNodes`).
- **Centre card** — Node title and description.
- **Right wing** — "Next Choices": `activeNode.choices` array.

Clicking any choice/previous node calls `handleNodeSelect`, which pushes the current node to `history` and zooms to the new node. The overlay hides briefly during the camera transition (`scheduleOverlay` + 600ms timeout) to avoid content overlap during the zoom.

### On-mount behaviour

On mount, `MapView` auto-zooms to `'start'` (300ms delay) and shows the overlay (900ms delay) so first-time visitors land on a node immediately. Both timeouts are cleaned up on unmount.

---

## 7. Shared config files

### `src/config/constants.ts`

```ts
export const CANVAS_W = 6700;          // canvas coordinate width (px)
export const CANVAS_H = 4500;          // canvas coordinate height (px)
export const MOBILE_BREAKPOINT = 768;  // matches Tailwind 'md'
```

Both `StoryPage` and `MapView` import these. **Change once, updates both views.**

### `src/config/categoryStyles.ts`

```ts
export const BORDER_COLOR:        Record<NodeCategory, string>  // node card ring
export const CATEGORY_LABEL:      Record<NodeCategory, string>  // text colour
export const CATEGORY_LEFT_BORDER:Record<NodeCategory, string>  // story card accent
```

`BORDER_COLOR` is used in both views for canvas node cards. `CATEGORY_LABEL` and `CATEGORY_LEFT_BORDER` are used only in `StoryPage` for the story card UI. All three derive from the same `NodeCategory` type.

**Current category colours:**

| Category | Border | Used for |
|----------|--------|----------|
| `hotline` | yellow-400 | Initial call, SCR screening |
| `cares` | green-400 | CARES supportive track |
| `warning` | amber-400 | System traps / loop-back nodes |
| `investigation` | red-400 | ACS investigation track |
| `court` | red-700 | Article 10 court and all post-court nodes |
| `neutral` | neutral-500 | Dead ends, case closed |

---

## 8. Common editing tasks

### Edit story text for an existing node

Open `src/data/mariaStory.ts`. Find the `nodeContent[nodeId]` entry and edit the `blocks` array. Supported types: `text`, `quote`, `callout`, `image`.

### Add a new character story

1. Copy `src/data/mariaStory.ts` → `src/data/[name]Story.ts`
2. Change `id` to a unique string
3. Update `character`, `intro`, `ending`
4. Set `path[]` to an ordered list of valid node IDs
5. Add `nodeContent[nodeId]` for each node in the path
6. In `App.tsx`, import and pass to `<StoryPage storyConfig={...} />`

### Add a new statistic to a node

1. Open `src/data/statistics.tsx`
2. Write a new React component (no props needed)
3. Add it to the relevant `*_STATISTICS` export array
4. Verify `storyNodes.tsx` imports and assigns that array to the node

Each array entry adds one scroll phase after the node's story text. Order in the array = order on screen.

### Add a new node to the flowchart

1. `src/data/storyNodes.tsx` — add a new entry to `STORY_NODES` with all required fields
2. Set `x`/`y` to fit the canvas layout (see coordinate guide in §5)
3. Choose a `category` — add to `NodeCategory` in `types.ts` and `categoryStyles.ts` if new
4. Add directed edges to `EDGES`
5. Add `choices` entries in the nodes that should link to it
6. Optionally assign statistics

### Remove a node

1. Delete the entry from `STORY_NODES`
2. Remove all `EDGES` entries where `from` or `to` is the deleted ID
3. Remove any `choices` references in other nodes
4. Remove from any `path[]` in story config files

### Tune scroll pacing or camera

Edit `SCROLL_CONFIG` at the top of `src/components/StoryPage.tsx`. The dev server hot-reloads on every save — no page refresh needed.

- **Slower scroll feel:** increase the `phaseHeights` value for the relevant phase type
- **More/less overlay darkness:** adjust the `overlay` value for the phase
- **Wider/narrower story card:** adjust `layout.cardFraction` and `layout.cardMaxPx`
- **Stat entrance/exit rhythm:** adjust `statAnim.enterZone`, `exitZone`, `enterOffsetPx`, `exitOffsetPx`

---

## 9. Key architectural decisions

### No CSS transition on the canvas camera

The canvas `transform` is calculated in JavaScript every frame from `scrollY`, not via CSS `transition`. If a CSS transition were applied, the canvas would "spring" toward its target — fighting the user's scroll speed and causing lag. The JS approach keeps the camera in lock-step with scroll position.

This is why `cameraTransform` is in a `useMemo` rather than a `useState`, and why the scroll listener uses `requestAnimationFrame` throttling (one update per frame, not one per scroll event).

### Scroll-driven stat panel

Unlike CSS transitions (which run on a fixed timeline), scroll-driven animations let the user control the speed by scrolling faster or slower. The stat entrance/exit rhythm is designed so the stat is fully visible for the middle 50% of the phase — enough time to read at any pace.

### Fixed-width story card (no text reflow)

The story card width never changes — only `left` changes. If the card resized during the slide-left transition, text would reflow and the layout would flash. The fixed width ensures the slide is purely positional.

### Three-layer data model

| Layer | Serializable? | Shared? | Why separate |
|-------|--------------|---------|-------------|
| System graph (`storyNodes`) | Partly (has JSX icons) | Yes — both views | The institution's structure doesn't change between stories |
| Statistics (`statistics`) | No (JSX) | Via node assignments | Visual complexity lives here, not in story text |
| Narrative (`mariaStory`) | Yes (no JSX) | No — one per story | Each character has a different path and personal voice |

### No routing library

With two views, a `useState` in `App.tsx` is all that's needed. React Router would add ~15KB, a `BrowserRouter` wrapper, and route-matching logic for no user-visible benefit. The threshold to add a router is roughly 4+ distinct addressable views.

### Single `SCROLL_CONFIG` object

All scroll parameters are grouped at the top of `StoryPage.tsx` rather than spread throughout the JSX. When a designer says "the camera zooms in too fast", you change one number in one place rather than hunting for magic values. The object is `as const` for type narrowing.

---

## Source material

- `story.md` — Original narrative brief from The Bronx Defenders
- `flowchart.txt` — Initial canvas layout diagram
