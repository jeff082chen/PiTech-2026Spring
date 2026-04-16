# Developer Handoff — The Family Policing Machine

**Client:** The Bronx Defenders × Cornell Tech PiTech Studio  
**Type:** Scrollytelling web experience (static SPA)  
**Purpose:** Guide visitors through the real journey of a family pulled into NYC's child protective services system — a cinematic scroll-driven narrative over a live system flowchart, with embedded data visualizations sourced from public records.

---

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Project structure](#2-project-structure)
3. [How the scroll experience works](#3-how-the-scroll-experience-works)
4. [SCROLL_CONFIG reference](#4-scroll_config-reference)
5. [Data architecture](#5-data-architecture)
6. [Statistics chart system](#6-statistics-chart-system)
7. [The free-explore map (MapView)](#7-the-free-explore-map-mapview)
8. [Shared config files](#8-shared-config-files)
9. [Common editing tasks](#9-common-editing-tasks)
10. [Key architectural decisions](#10-key-architectural-decisions)
11. [Known issues & next steps](#11-known-issues--next-steps)

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
├── App.tsx                        Top-level view router — 'story' | 'map'
├── main.tsx                       React entry point
├── index.css                      Tailwind directives only
├── types.ts                       All shared TypeScript interfaces
│
├── config/
│   ├── constants.ts               CANVAS_W/H, MOBILE_BREAKPOINT — shared by both views
│   ├── categoryStyles.ts          Tailwind class maps keyed by NodeCategory
│   └── iconRegistry.ts            string → lucide-react component mapping
│
├── data/
│   ├── storyNodes.tsx             Runtime adapter: nodes.json + statistics.json → StoryNode[]
│   ├── config/
│   │   ├── nodes.json             15 nodes + 15 directed edges (pure JSON — edit here)
│   │   └── statistics.json        21 chart schemas (pure JSON — edit here)
│   └── stories/
│       └── maria.json             Maria's narrative (path, story text, character — pure JSON)
│
└── components/
    ├── StoryPage.tsx              Scroll-driven narrative (primary view)  ~624 lines
    ├── MapView.tsx                Free-explore click map (secondary view) ~337 lines
    └── charts/
        ├── StatRenderer.tsx       Main dispatch: chart.type → renderer component
        ├── accentMap.ts           AccentColor token → Tailwind class maps
        ├── customRegistry.ts      componentId string → custom React component
        ├── BigNumber.tsx
        ├── TwoCounter.tsx
        ├── Pipeline.tsx
        ├── BarCompare.tsx
        ├── CardCompare.tsx
        ├── HorizontalBars.tsx
        ├── StackedBars.tsx
        ├── QuoteList.tsx
        ├── HighlightCallout.tsx
        ├── GridCards.tsx
        ├── CostCompare.tsx
        ├── TimelineBar.tsx
        ├── LineChart.tsx
        └── custom/
            ├── WarrantBox.tsx     Bespoke visual (ACS warrant rate)
            └── PlacementInstability.tsx  Bespoke visual (icon grid)
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
2. **Inner div** — `position: sticky; top: 0; height: 100vh` — the actual viewport that never scrolls; only its children change.

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
    screenFade:  '600ms ease',                    // hero/overview/ending fade
    focusHint:   '400ms ease',                    // node title hint at bottom
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

All content is now **pure JSON** — no React knowledge needed to edit nodes, statistics, or story text. Three independent layers:

```
data/config/nodes.json      ← System graph  (shared by both views and all stories)
data/config/statistics.json ← Chart schemas (attached to nodes by ID reference)
data/stories/maria.json     ← Narrative config (one per character — path + story text)
```

The adapter file `src/data/storyNodes.tsx` wires these together at startup into the `StoryNode[]` format that `StoryPage` and `MapView` expect.

### Data flow

```
nodes.json ──┬──────────────────────────────────→ iconRegistry.ts
             │  node.icon (string key)                    │
             └────────────────────────────────────────────┤
                                                          ▼
statistics.json ──→ StatRenderer ──→ chart renderers → stat panel
                         │
                   switch(chart.type) → BigNumber / Pipeline / LineChart / …
                   "component" → customRegistry → WarrantBox / PlacementInstability

maria.json ───────────────────────────────────→ StoryPage
                                         path[] → node sequence
                                         nodeContent → story card blocks
                                         character/intro/ending → screens
```

---

### Layer 1 — System graph (`src/data/config/nodes.json`)

Defines the 15 nodes of the family policing flowchart and the 15 directed edges between them.

**Exports (via adapter `storyNodes.tsx`):**
- `STORY_NODES` (default) — `Record<string, StoryNode>`
- `EDGES` (named) — `Edge[]`

**Node JSON schema:**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | Unique key — must match the object key |
| `title` | `string` | Node headline shown in both views |
| `description` | `string` | Institutional explanation (system-level, not personal) |
| `icon` | `string` | Key in `ICON_REGISTRY` (e.g. `"ShieldAlert"`) |
| `iconColor` | `string?` | Tailwind text class (e.g. `"text-yellow-500"`); default `text-neutral-400` |
| `x`, `y` | `number` | Node centre position on the 6700×4500 canvas |
| `category` | `NodeCategory` | Controls border colour in both views |
| `statisticIds` | `string[]?` | Ordered IDs from `statistics.json`; each becomes one scroll phase |
| `choices` | `Choice[]` | Forward edges; empty array = terminal node |

**Canvas coordinate layout:**

```
y ≈ 600–900   Better-outcome branches (screened out, CARES, unsubstantiated)
y ≈ 1100      Supervision endpoint
y ≈ 2000      Main spine: start → SCR → safety assessment → investigation → court
y ≈ 2950–3550 Removal branches: foster care → kinship / group home
```

X spacing is ~650 px per depth column.

**`edges` sync rule:** Every `nextNodeId` in a `choices` array must have a corresponding entry in the `edges` array. `EDGES` is used to draw SVG bezier curves in both views and to compute reverse traversal in `MapView`. There is no runtime validation — a mismatch silently drops an edge line.

**Icon registry** (`src/config/iconRegistry.ts`):

| `icon` string | Used for node |
|--------------|---------------|
| `"ShieldAlert"` | start |
| `"Search"` | scr_screening |
| `"XCircle"` | screened_out |
| `"Shield"` | safety_assessment |
| `"Handshake"` | cares_track |
| `"EyeOff"` | investigation |
| `"Scale"` | determination, court_hearing |
| `"CheckCircle2"` | unsubstantiated |
| `"ClipboardList"` | case_plan |
| `"FileCheck"` | court_filing |
| `"Home"` | supervision_order |
| `"AlertTriangle"` | foster_care_removal |
| `"Heart"` | kinship_placement |
| `"Building2"` | group_home |

To add a new icon: import it from `lucide-react` in `iconRegistry.ts` and add an entry to `ICON_REGISTRY`.

---

### Layer 2 — Statistics (`src/data/config/statistics.json`)

Declarative chart schemas. Each entry maps to one scroll phase in `StoryPage`. Schema:

```jsonc
{
  "some-stat-id": {
    "id": "some-stat-id",
    "nodeId": "investigation",       // which node this belongs to
    "sources": [
      { "label": "NYC ACS Annual Report 2023" },
      { "label": "OCFS Data", "url": "https://..." }
    ],
    "chart": {
      "type": "big-number",          // see §6 for all chart types
      // ... chart-type-specific fields
    }
  }
}
```

The `statisticIds` array on each node in `nodes.json` determines which stats appear and in what order.

See **§6** for the full chart type reference.

---

### Layer 3 — Narrative config (`src/data/stories/maria.json`)

One file per character. **No JSX, no React imports** — fully JSON-serializable.

**`StoryConfig` schema:**

```jsonc
{
  "id": "maria",
  "title": "Maria's Story",

  "character": {
    "name": "Maria",
    "summary": "1–2 sentence intro shown on hero screen",
    "heroImage": null                  // optional portrait URL
  },

  "intro": {
    "title": "A Call That Changes Everything",
    "description": "Shown on hero screen below summary"
  },

  "path": ["start", "scr_screening", "..."],   // ordered node IDs

  "nodeContent": {
    "start": {
      "blocks": [
        { "type": "text",    "title": "The Call", "body": "..." },
        { "type": "callout", "text": "..." },
        { "type": "quote",   "text": "...", "attribution": "Maria" }
      ]
    }
    // one entry per node in path[]
  },

  "ending": {
    "title": "The System Stays",
    "description": "...",
    "actions": ["CTA bullet 1", "CTA bullet 2"]
  }
}
```

**Content block types:**

| Type | Required | Optional | Renders as |
|------|----------|----------|------------|
| `text` | `body` | `title` | Paragraph with optional bold heading |
| `quote` | `text` | `attribution` | Italic pull-quote with red left border |
| `callout` | `text` | — | Amber-bordered callout box |
| `image` | `src` | `caption`, `alt` | Full-width image |

---

## 6. Statistics chart system

All chart components live in `src/components/charts/`. `StatRenderer.tsx` dispatches on `chart.type`.

### AccentColor token

All renderers accept an `accentColor` field of type `AccentColor`:

| Value | Text class | BG class | Typical use |
|-------|-----------|----------|-------------|
| `"red"` | text-red-400 | bg-red-500 | Primary alert / key numbers |
| `"amber"` | text-amber-400 | bg-amber-500 | Secondary alert / CARES data |
| `"orange"` | text-orange-400 | bg-orange-500 | Mid-pipeline / service plans |
| `"green"` | text-green-400 | bg-green-500 | Positive outcomes (rare) |
| `"blue"` | text-blue-400 | bg-blue-500 | Neutral information |
| `"pink"` | text-pink-400 | bg-pink-500 | Kinship-related |
| `"neutral"` | text-neutral-400 | bg-neutral-500 | Secondary data / control group |

Full Tailwind class maps live in `src/components/charts/accentMap.ts` — never hardcode colour classes in renderers.

---

### Chart type reference

#### `big-number`
Large centered number with optional unit, description, tag grid, and footer citation.

```jsonc
{
  "type": "big-number",
  "label": "Section heading (small caps)",
  "value": "28",
  "unit": "years",
  "accentColor": "red",
  "description": "Explanatory sentence",
  "tags": ["Tag A", "Tag B"],
  "footer": "NY Social Services Law §422"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `value` | ✅ | String — e.g. `"28"`, `"3×"`, `"$107,200"` |
| `unit` | — | Shown below value |
| `accentColor` | ✅ | Controls value colour |
| `description` | — | Paragraph below unit |
| `tags` | — | Renders as 2-column grid of small cards |
| `footer` | — | Bottom citation, italic small text |

**Currently used by:** `determination-record`, `court-marianna`, `removal-marginal-cases`

---

#### `two-counter`
Two stacked numbers with a dividing line — primary (large) over secondary (smaller).

```jsonc
{
  "type": "two-counter",
  "label": "New York City, 2023",
  "primary":   { "value": "95,590", "description": "calls", "accentColor": "neutral" },
  "secondary": { "value": "22,120", "description": "ever substantiated", "qualifier": "(23.1%)", "accentColor": "neutral" },
  "note": "Over 73,000 families were found to have done nothing wrong."
}
```

**Currently used by:** `start-scr-counter`

---

#### `pipeline`
Narrowing horizontal bar sequence — visualises a funnel.

```jsonc
{
  "type": "pipeline",
  "label": "From Call to Removal — NYC, 2023",
  "stages": [
    { "label": "SCR Hotline Calls",  "pct": 100, "color": "neutral", "note": "95,590" },
    { "label": "Children Removed",   "pct": 8,   "color": "red",     "note": "~8%" }
  ]
}
```

`pct: 100` = widest bar (container width). Label renders inside bar when `pct ≥ 30`, otherwise to the right.

**Currently used by:** `start-pipeline`

---

#### `bar-compare`
2–4 vertical bars compared by height.

```jsonc
{
  "type": "bar-compare",
  "label": "SCR Call Acceptance Rate",
  "bars": [
    { "value": "75%", "label": "New York",     "heightPct": 100, "accentColor": "red" },
    { "value": "50%", "label": "National Avg.", "heightPct": 67,  "accentColor": "neutral" }
  ],
  "note": "New York passes 3 in 4 calls."
}
```

`heightPct: 100` = tallest bar (180px). Others scale proportionally.

**Currently used by:** `scr-acceptance-rate`

---

#### `card-compare`
Two-column comparison. Two variants controlled by `variant`:

**`"stat"` variant** — two numbers side-by-side:
```jsonc
{
  "type": "card-compare", "variant": "stat",
  "label": "Substantiation Rate Comparison",
  "left":  { "header": "Anonymous Tips", "accentColor": "neutral", "preValue": "1 in 24", "value": "6.7%", "postValue": "substantiated" },
  "right": { "header": "All Cases",      "accentColor": "red",     "preValue": "",        "value": "22.5%","postValue": "substantiated" },
  "note": "Both families receive an investigator at the door."
}
```

**`"district"` variant** — two geographic areas with key-value rows:
```jsonc
{
  "type": "card-compare", "variant": "district",
  "label": "FY 2023 — Geography of Intervention",
  "left":  { "name": "Highbridge / Concourse", "subtitle": "South Bronx", "code": "District BX04", "accentColor": "red",
             "rows": [{ "key": "SCR Intakes", "value": "1,462" }] },
  "right": { "name": "Park Slope", "subtitle": "Brooklyn", "code": "District BK06", "accentColor": "neutral",
             "rows": [{ "key": "SCR Intakes", "value": "333" }] },
  "note": "Same system. Opposite outcomes."
}
```

**Currently used by:** `scr-anonymous-tips` (stat), `court-geography` (district)

---

#### `horizontal-bars`
Horizontal bar chart — one bar per row. Supports `**bold**` syntax in `callout`.

```jsonc
{
  "type": "horizontal-bars",
  "label": "% of Children Investigated by ACS, 2021",
  "bars": [
    { "label": "Black children",  "pct": 44, "accentColor": "red" },
    { "label": "Latino children", "pct": 43, "accentColor": "amber" },
    { "label": "White children",  "pct": 19, "accentColor": "neutral" }
  ],
  "callout": "A Black child has nearly a **50% chance** of being investigated by age 18."
}
```

**Currently used by:** `investigation-race-rates`

---

#### `stacked-bars`
Each row is a two-color bar: left = indicated (highlighted), right = unsubstantiated (neutral).

```jsonc
{
  "type": "stacked-bars",
  "label": "FY 2023 — What Follows a Report",
  "leftLabel": "Indicated",
  "rightLabel": "unsubstantiated",
  "rows": [
    { "label": "Black & Latino families", "leftPct": 18 },
    { "label": "White families",          "leftPct": 24 },
    { "label": "All families",            "leftPct": 23 }
  ],
  "note": "56.6% of all intakes were unsubstantiated."
}
```

`leftPct` controls the highlighted segment; right = `100 - leftPct`.

**Currently used by:** `determination-dragnet`

---

#### `quote-list`
Multiple blockquotes with red left border.

```jsonc
{
  "type": "quote-list",
  "label": "Documented Investigator Tactics — Bronx Families",
  "quotes": [
    { "text": "\"I'm not going to stop coming.\"" },
    { "text": "\"We can do this the easy way or I can get a warrant.\"" }
  ],
  "note": "Families have no right to counsel at this stage."
}
```

**Currently used by:** `safety-investigator-quotes`

---

#### `highlight-callout`
Large stat in an accented border box, plus a bullet list.

```jsonc
{
  "type": "highlight-callout",
  "label": "The Reality of 'Voluntary' Service Plans",
  "highlight": { "value": "9 in 10", "description": "families report coercion", "accentColor": "amber" },
  "bullets": ["Refusing services = evidence of non-cooperation", "..."],
  "note": "Citation."
}
```

**Currently used by:** `case-plan-coercion`

---

#### `grid-cards`
N-column grid of stat cards. Optional `infoBox` below. `cardStyle` controls card fill.

```jsonc
{
  "type": "grid-cards",
  "label": "After the Supervision Order",
  "columns": 2,
  "cardStyle": "colored",      // "dark" (neutral bg, default) | "colored" (accent bg)
  "cards": [
    { "value": "1 in 3",  "description": "orders renewed at least once", "accentColor": "red" },
    { "value": "monthly", "description": "ACS home visits required",    "accentColor": "amber" }
  ],
  "infoBox": {
    "title": "Any of the following can trigger escalation:",
    "bullets": ["A new concern reported to the hotline", "..."]
  }
}
```

**Currently used by:** `supervision-renewal`, `kinship-support-gap`, `group-home-outcomes`

---

#### `cost-compare`
Two items stacked with "vs." separator — optimised for dollar amounts.

```jsonc
{
  "type": "cost-compare",
  "label": "Annual Cost Comparison",
  "items": [
    { "description": "To separate a child",    "value": "$107,200", "note": "per child · per year · 2024", "accentColor": "red" },
    { "description": "To keep family together","value": "$3,600",   "note": "per year",                    "accentColor": "neutral" }
  ],
  "conclusion": "The system chose separation."
}
```

**Currently used by:** `removal-cost`

---

#### `timeline-bar`
Large headline number + segmented horizontal bar. All `widthPct` values should sum to ~100.

```jsonc
{
  "type": "timeline-bar",
  "label": "How Long a Family Court Case Takes",
  "headline": { "value": "18", "unit": "months average", "accentColor": "red" },
  "segments": [
    { "label": "Initial hearing",      "widthPct": 8,  "accentColor": "neutral" },
    { "label": "Service compliance",   "widthPct": 30, "accentColor": "orange" },
    { "label": "Follow-up hearings",   "widthPct": 47, "accentColor": "red" }
  ],
  "note": "Each hearing lasts ~30 minutes. The case lasts months to years."
}
```

**Currently used by:** `court-duration`

---

#### `line-chart`
SVG line chart. Renderer auto-normalises actual values to SVG coordinates from `xAxis`/`yAxis` bounds. Supports area fill, multiple series, time annotations, and a callout block.

```jsonc
{
  "type": "line-chart",
  "label": "ACS Case Volume, 2004–2023",
  "xAxis": { "type": "year", "min": 2004, "max": 2023 },
  "yAxis": { "min": 0, "max": 110000, "format": "number" },
  "series": [{
    "id": "acs-cases", "label": "ACS Cases", "accentColor": "red",
    "dashed": false, "areaFill": true,
    "points": [{ "x": 2004, "y": 72000 }, { "x": 2023, "y": 54000 }]
  }],
  "annotations": [{ "x": 2020, "spanYears": 1, "label": "COVID" }],
  "note": "Cases fell when children were home.",
  "callout": { "text": "Reform in name.", "subtext": "Secondary detail." }
}
```

`yAxis.format`: `"number"` = raw count labels, `"percent"` = appends `%`.

**Currently used by:** `scr-case-volume`, `cares-trend`

---

#### `component` (escape hatch)
Used when a visual is too bespoke for any declarative type. `componentId` must be registered in `customRegistry.ts`.

```jsonc
{
  "type": "component",
  "componentId": "WarrantBox",
  "data": {
    "label": "ACS Home Entries Per Year",
    "total": "~56,400",
    "totalLabel": "ACS home entries",
    "highlight": "94 warrants",
    "warrantRate": "<0.2%"
  }
}
```

Custom components receive `{ data: Record<string, unknown> }` and cast internally.

**Currently registered:** `WarrantBox`, `PlacementInstability`

**Adding a new custom component:**
1. Create `src/components/charts/custom/NewChart.tsx` with props `{ data: Record<string, unknown> }`
2. Add to `src/components/charts/customRegistry.ts`
3. Reference via `"type": "component", "componentId": "NewChart"` in `statistics.json`

---

## 7. The free-explore map (MapView)

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

## 8. Shared config files

### `src/config/constants.ts`

```ts
export const CANVAS_W = 6700;          // canvas coordinate width (px)
export const CANVAS_H = 4500;          // canvas coordinate height (px)
export const MOBILE_BREAKPOINT = 768;  // matches Tailwind 'md'
```

Both `StoryPage` and `MapView` import these. **Change once, updates both views.**

### `src/config/categoryStyles.ts`

```ts
export const BORDER_COLOR:         Record<NodeCategory, string>  // node card ring
export const CATEGORY_LABEL:       Record<NodeCategory, string>  // text colour
export const CATEGORY_LEFT_BORDER: Record<NodeCategory, string>  // story card accent
```

`BORDER_COLOR` is used in both views. `CATEGORY_LABEL` and `CATEGORY_LEFT_BORDER` are used only in `StoryPage`.

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

## 9. Common editing tasks

### Edit story text for an existing node

Open `src/data/stories/maria.json`. Find the `nodeContent[nodeId]` entry and edit the `blocks` array.

Supported block types: `text`, `quote`, `callout`, `image` — see §5 Layer 3 for field reference.

### Add a new character story

1. Copy `src/data/stories/maria.json` → `src/data/stories/[name].json`
2. Change `id` to a unique string (e.g. `"jose"`)
3. Update `character`, `intro`, `ending`
4. Set `path[]` to an ordered list of valid node IDs from `nodes.json`
5. Add `nodeContent[nodeId]` blocks for each node in `path`
6. In `App.tsx`:
   ```ts
   import joseJson from './data/stories/jose.json';
   const JOSE_STORY = joseJson as StoryConfig;
   // pass to <StoryPage storyConfig={JOSE_STORY} ... />
   ```

### Edit node title, description, or position

Open `src/data/config/nodes.json`. Find the node by its key and edit the relevant fields. `x`/`y` are canvas coordinates (canvas is 6700×4500 — see coordinate guide in §5).

### Add a new statistic to a node

1. Add a new entry to `src/data/config/statistics.json` with a unique `id` and a valid `chart` schema (see §6)
2. Add that `id` to the node's `statisticIds` array in `nodes.json`

The stat appears automatically in the scroll experience. Order in `statisticIds` = order on screen.

### Add a new node to the flowchart

1. `src/data/config/nodes.json` — add a new entry under `nodes` with all required fields
2. Set `x`/`y` to fit the canvas layout (see coordinate guide in §5)
3. Add directed edges to the `edges` array: `{ "from": "...", "to": "new-node-id" }`
4. Add `choices` entries in the nodes that should link to it
5. If using a new icon: add it to `src/config/iconRegistry.ts`
6. If using a new `category`: add to `NodeCategory` in `types.ts` and `categoryStyles.ts`

### Remove a node

1. Delete the entry from `nodes.json → nodes`
2. Remove all `edges` entries where `from` or `to` is the deleted ID
3. Remove any `choices` references in other nodes
4. Remove from any `path[]` in story JSON files
5. Remove or reassign any `statisticIds` entries that belonged to this node

### Add a new chart to `statistics.json`

Choose the closest existing chart type from §6 and write the JSON schema. If no type fits, use the `"component"` escape hatch (see §6 — component).

### Tune scroll pacing or camera

Edit `SCROLL_CONFIG` at the top of `src/components/StoryPage.tsx`. The dev server hot-reloads on every save.

- **Slower scroll feel:** increase the `phaseHeights` value for the relevant phase type
- **More/less overlay darkness:** adjust the `overlay` value for the phase
- **Wider/narrower story card:** adjust `layout.cardFraction` and `layout.cardMaxPx`
- **Stat entrance/exit rhythm:** adjust `statAnim.enterZone`, `exitZone`, `enterOffsetPx`, `exitOffsetPx`

---

## 10. Key architectural decisions

### All content in JSON — no React knowledge needed

Nodes, statistics, and story text all live in `.json` files. `storyNodes.tsx` is a thin runtime adapter that converts JSON icons (strings) to React elements and wires `statisticIds` to rendered `<StatRenderer>` instances. Content editors never touch TypeScript or JSX.

### No CSS transition on the canvas camera

The canvas `transform` is calculated in JavaScript every frame from `scrollY`, not via CSS `transition`. If a CSS transition were applied, the canvas would "spring" toward its target — fighting the user's scroll speed and causing lag. The JS approach keeps the camera in lock-step with scroll position.

This is why `cameraTransform` is in a `useMemo` rather than a `useState`, and why the scroll listener uses `requestAnimationFrame` throttling (one update per frame, not one per scroll event).

### Scroll-driven stat panel

Unlike CSS transitions (which run on a fixed timeline), scroll-driven animations let the user control the speed by scrolling faster or slower. The stat entrance/exit rhythm is designed so the stat is fully visible for the middle 50% of the phase — enough time to read at any pace.

### Fixed-width story card (no text reflow)

The story card width never changes — only `left` changes. If the card resized during the slide-left transition, text would reflow and the layout would flash. The fixed width ensures the slide is purely positional.

### AccentColor token system

All chart renderers use `AccentColor` string tokens (`"red"`, `"amber"`, etc.) rather than raw Tailwind classes. The `accentMap.ts` file is the single source of truth for token → class conversions. This means a colour can be changed globally (e.g. switching `"amber"` from `text-amber-400` to `text-amber-300`) without touching any chart component.

### Three-layer data model

| Layer | Serializable? | Shared? | Why separate |
|-------|--------------|---------|-------------|
| System graph (`nodes.json`) | ✅ Yes | Yes — both views, all stories | The institution's structure doesn't change between characters |
| Statistics (`statistics.json`) | ✅ Yes | Via `statisticIds` reference | Visual complexity lives here, not in story text |
| Narrative (`maria.json`) | ✅ Yes | No — one per character | Each character has a different path and personal voice |

### No routing library

With two views, a `useState` in `App.tsx` is all that's needed. React Router would add ~15KB, a `BrowserRouter` wrapper, and route-matching logic for no user-visible benefit. The threshold to add a router is roughly 4+ distinct addressable views.

### Single `SCROLL_CONFIG` object

All scroll parameters are grouped at the top of `StoryPage.tsx` rather than spread throughout the JSX. When a designer says "the camera zooms in too fast", you change one number in one place rather than hunting for magic values.

---

## 11. Known issues & next steps

### Known issues

| Issue | Location | Notes |
|-------|----------|-------|
| No runtime validation of `statisticIds` | `storyNodes.tsx` | A missing stat ID silently drops the phase; no error thrown |
| No runtime validation of `edges` | `storyNodes.tsx` | A `nextNodeId` with no matching edge silently drops an SVG line |
| Mobile map pan (touch-drag) not implemented | `MapView.tsx` | Mobile users can only tap nodes; no pinch-zoom or drag |
| Keyboard navigation missing | Both views | No `aria-label`, no keyboard-accessible scroll triggers |

### Possible next steps

- **Additional character stories** — copy `maria.json`, change `path` and `nodeContent`, import in `App.tsx`
- **Shareable URLs** — encode active node history as a query param in `MapView`
- **Analytics** — PostHog or Mixpanel event on each phase transition
- **Accessibility pass** — `aria-label` on all interactive elements, keyboard-accessible node navigation in `MapView`
- **CMS integration** — replace `stories/` JSON files with Sanity or Contentful; `nodes.json` and `statistics.json` could stay local or move as well
- **New chart types** — add to `types.ts` union, implement renderer in `charts/`, register in `StatRenderer.tsx`

---

## Source material

- `story.md` — Original narrative brief from The Bronx Defenders
- `flowchart.txt` — Initial canvas layout diagram
- `CONFIG_REFACTOR.md` — Full specification for the JSON-driven content architecture
