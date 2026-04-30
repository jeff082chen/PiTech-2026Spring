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
9. [Visual builder UIs](#9-visual-builder-uis)
10. [Common editing tasks](#10-common-editing-tasks)
11. [Key architectural decisions](#11-key-architectural-decisions)
12. [Known issues & next steps](#12-known-issues--next-steps)

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
public/
└── story-images/                  ← DROP image files here; reference as /story-images/filename.jpg

src/
├── App.tsx                        Top-level view router — 'story' | 'map' | 'builder' | 'graph-editor'
├── main.tsx                       React entry point
├── index.css                      Tailwind directives only
├── types.ts                       All shared TypeScript interfaces
├── vite-env.d.ts                  Vite client type declarations (PNG imports, etc.)
│
├── assets/
│   └── bronx-defenders-logo.png  ← REPLACE to update the logo (keep the filename)
│
├── config/
│   ├── constants.ts               CANVAS_W/H, MAP_CANVAS_H, MOBILE_BREAKPOINT
│   ├── categoryStyles.ts          Tailwind class maps keyed by NodeCategory
│   └── iconRegistry.ts            string → lucide-react component mapping
│
├── data/
│   ├── storyNodes.tsx             Runtime adapter: nodes.json + statistics.json → StoryNode[]
│   ├── config/
│   │   ├── nodes.json             37 nodes (15 primary + 22 hidden) + 37 directed edges
│   │   └── statistics.json        21 chart schemas (pure JSON — edit here)
│   └── stories/
│       └── story.json             ← EDIT HERE: the active story (path, text, character, CTA)
│
└── components/
    ├── StoryPage.tsx              Scroll-driven narrative (primary view)
    ├── MapView.tsx                Free-explore map: zoom/pan + expand hidden nodes
    ├── ContentWarning.tsx         Full-screen content warning overlay (configure via WARNING_CONFIG)
    ├── builder/                   Story narrative editor (StoryBuilder UI)
    │   ├── StoryBuilder.tsx       Top-level builder shell
    │   ├── BlockEditor.tsx        Story block editing panel
    │   ├── MetadataEditor.tsx     Character / intro / ending fields
    │   ├── NodeEditor.tsx         Node-level editing
    │   ├── PathBuilder.tsx        Drag-and-drop path sequence
    │   ├── PreviewPane.tsx        Live story preview inside builder
    │   ├── StatsLibrary.tsx       Statistics selector sidebar
    │   └── MapEditorModal.tsx     (legacy — superseded by GraphEditor)
    ├── graph-editor/              Visual graph + statistics editor
    │   ├── GraphEditor.tsx        Top-level shell (state, download, layout)
    │   ├── FlowCanvas.tsx         Pan/zoom canvas: node render + drag + edge overlay
    │   ├── EdgeLayer.tsx          SVG bezier edges with click-to-insert hit areas
    │   ├── NodeInspector.tsx      Right panel: node fields, choices, statistics list
    │   ├── StatisticsEditor.tsx   Stat list with reorder/delete; opens StatForm modal
    │   ├── StatForm.tsx           Split-panel form: type-specific fields + live preview
    │   └── StatFormFields/        One component per chart type
    │       ├── BigNumberFields.tsx
    │       ├── TwoCounterFields.tsx
    │       ├── PipelineFields.tsx
    │       ├── BarCompareFields.tsx
    │       ├── CardCompareFields.tsx
    │       ├── HorizontalBarsFields.tsx
    │       ├── StackedBarsFields.tsx
    │       ├── QuoteListFields.tsx
    │       ├── HighlightCalloutFields.tsx
    │       ├── GridCardsFields.tsx
    │       ├── CostCompareFields.tsx
    │       ├── TimelineBarFields.tsx
    │       └── LineChartFields.tsx
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

`App.tsx` holds a single `currentView: 'story' | 'map' | 'builder' | 'graph-editor'` state — no routing library needed.

```
default            → <StoryPage storyConfig={THE_STORY} onExploreMap={...} />
"Explore Full Map" → <MapView onBackToLanding={...} />
"Home"             → back to StoryPage
"Story Builder"*   → <StoryBuilder onExit={...} onOpenGraphEditor={...} />
"Graph Editor"*    → <GraphEditor onExit={...} />
```

*Hidden buttons — see §9 for how to access them.

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
  | { type: 'node-move';     nodeId: string }
  | { type: 'node-zoom-in';  nodeId: string }
  | { type: 'node-story';    nodeId: string }
  | { type: 'node-image';    nodeId: string; imageIndex: number }
  | { type: 'node-stat';     nodeId: string; statIndex: number }
  | { type: 'node-zoom-out'; nodeId: string }
  | { type: 'ending' }
)
```

**Phase sequence for a node with 1 story image and 2 statistics:**
```
node-move     → camera pans from previous node to this node
node-zoom-in  → camera zooms in to fill-screen scale
node-story    → story card appears (centered)
node-image    → story card slides left; image panel appears on right (scroll-driven)
node-stat     → stat 0 panel replaces image panel (scroll-driven)
node-stat     → stat 1 panel (scroll-driven)
node-zoom-out → camera zooms back out to normal scale
```

Images and statistics are **independent right-panel slots**: images come from `story.json → nodeContent[id].images`, statistics come from `nodes.json → statisticIds → statistics.json`. A node can have any combination (images only, stats only, both, or neither).

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
| 6 | Story card + image panel + stat panel | `showContent` opacity wrapper |
| 7 | Ending screen | `phaseType === 'ending'` opacity |
| 8 | Nav + progress bar | Always visible, `z-50` |

### Story card layout

The story card has a fixed width (`min(540px, 46vw)` on desktop, `90vw` on mobile) — only its `left` position changes, preventing text reflow during transitions.

```
node-story phase:         card centered  →  (vw − cardWidth) / 2
node-image / node-stat:   card left      →  vw × 0.03  (CSS transition: cardSlide)
```

The image panel and stat panel share the same right-half position (`left: 50% + 16px`, `width: 44vw`). Only one is visible at a time — image phases precede stat phases.

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
data/stories/story.json     ← Narrative config (one per character — path + story text)
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

story.json ───────────────────────────────────→ StoryPage
                                         path[] → node sequence
                                         nodeContent → story card blocks
                                         character/intro/ending → screens
```

---

### Layer 1 — System graph (`src/data/config/nodes.json`)

Defines **37 nodes** and **37 directed edges** across two tiers:

- **15 primary nodes** — the main flowchart spine, visible in both StoryPage and MapView overview.
- **22 hidden nodes** — expanded detail sub-trees, visible only when the user expands a primary node in MapView. They have `nodeType: "hidden"` and a `parentPrimaryId` pointing to their parent primary node.

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
| `x`, `y` | `number` | Node centre position on the canvas |
| `category` | `NodeCategory` | Controls border colour in both views |
| `statisticIds` | `string[]?` | Ordered IDs from `statistics.json`; each becomes one scroll phase |
| `choices` | `Choice[]` | Forward edges; empty array = terminal node |
| `nodeType` | `'primary' \| 'hidden'?` | Omit or set `"primary"` for main nodes; `"hidden"` for sub-tree nodes |
| `parentPrimaryId` | `string?` | Required when `nodeType: "hidden"` — the primary node that owns this sub-node |

**Canvas coordinate layout:**

Primary nodes (StoryPage canvas: `6700 × 4500`, MapView canvas: `6700 × 5500`):

```
y ≈ 600–900    Better-outcome exits (screened_out, cares_track, unsubstantiated)
y ≈ 2000       Main spine: start → SCR → safety_assessment → investigation → court → supervision_order
y ≈ 2950–3550  Removal branches: foster_care_removal → kinship_placement / group_home
```

Hidden node zones (MapView only — require `MAP_CANVAS_H = 5500`):

```
y ≈ 1350       CARES sub-tree (parent: cares_track)
y ≈ 1500–2300  Supervision sub-tree (parent: supervision_order)
y ≈ 2450       Fork node (parent: scr_screening)
y ≈ 3400–5000  Foster care placement tree (parent: foster_care_removal)
```

X spacing is ~650 px per column for primary nodes; hidden nodes cluster near their parent's x position.

**`edges` sync rule:** Every `nextNodeId` in a `choices` array must have a corresponding entry in the `edges` array. `EDGES` is used to draw SVG bezier curves in both views and to compute reverse traversal in `MapView`. There is no runtime validation — a mismatch silently drops an edge line.

StoryPage filters edges to primary-only: both `edge.from` and `edge.to` must be non-hidden nodes.

**Icon registry** (`src/config/iconRegistry.ts`):

| `icon` string | Used for |
|--------------|----------|
| `"ShieldAlert"` | `start` |
| `"Search"` | `scr_screening` |
| `"XCircle"` | `screened_out` |
| `"Shield"` | `safety_assessment` |
| `"Handshake"` | `cares_track`, `community_services`, `mandated_preventive` |
| `"EyeOff"` | `investigation` |
| `"Scale"` | `determination`, `court_hearing` |
| `"CheckCircle2"` | `unsubstantiated`, `cares_success`, `supervision_success` |
| `"ClipboardList"` | `case_plan`, `family_led_assessment` |
| `"FileCheck"` | `court_filing`, `service_plan_cares`, `court_service_plan` |
| `"Home"` | `supervision_order`, `family_setting_decision`, `traditional_foster_care_node` |
| `"AlertTriangle"` | `foster_care_removal`, `traditional_investigation_loop`, `supervision_failure` |
| `"Heart"` | `kinship_placement`, `placement_decision`, `kinship_foster_care` |
| `"Building2"` | `group_home`, `residential_placement` |
| `"Users"` | `fork`, `cares_entry`, `cares_main`, `supervision_intake` |
| `"Stethoscope"` | `medical_needs_decision`, `specialized_foster_care` |
| `"Brain"` | `trauma_decision`, `effc` |

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

### Layer 3 — Narrative config (`src/data/stories/story.json`)

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
      ],
      "images": [
        {
          "src":     "/story-images/my-photo.jpg",  // file in public/story-images/
          "caption": "Optional caption",
          "alt":     "Description for screen readers"
        }
      ]
    }
    // one entry per node in path[]; images is optional
  },

  "ending": {
    "title": "The System Stays",
    "description": "...",
    "actions": [
      {
        "label": "Support The Bronx Defenders",     // heading text
        "description": "Brief supporting sentence.", // shown below label (optional)
        "url": "https://www.bronxdefenders.org"      // set to "" for plain text (no link)
      }
    ]
  }
}
```

**Content block types (`blocks` array):**

| Type | Required | Optional | Renders as |
|------|----------|----------|------------|
| `text` | `body` | `title` | Paragraph with optional bold heading |
| `quote` | `text` | `attribution` | Italic pull-quote with red left border |
| `callout` | `text` | — | Amber-bordered callout box |
| `image` | `src` | `caption`, `alt` | Full-width inline image |

**Story images (`images` array):**

Each entry in `images` creates a `node-image` scroll phase that shows the image in the right panel (same animation as stat panels), **before** any statistics for that node.

| Field | Required | Description |
|-------|----------|-------------|
| `src` | ✅ | Path served from `public/` — e.g. `/story-images/photo.jpg` |
| `caption` | — | Italic text shown below the image |
| `alt` | — | Accessible description |

Image files go in `public/story-images/`. The `public/` folder is served as-is by Vite — no build step needed to add new images. Editable in **Story Builder → Node Editor → Story Images**.

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
    { "label": "Black & Latino families", "leftPct": 22 },
    { "label": "White families",          "leftPct": 26 },
    { "label": "All families",            "leftPct": 23.1 }
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

`MapView` uses the same `STORY_NODES` and `EDGES` data but works differently — it's a click-to-explore interface with free zoom/pan and collapsible hidden node sub-trees.

### State

| Variable | Type | Purpose |
|----------|------|---------|
| `activeNodeId` | `string \| null` | `null` = overview; set = zoomed to that node |
| `showOverlay` | `boolean` | Detail overlay visibility (delayed 600ms after node zoom) |
| `history` | `string[]` | Ordered list of previously visited node IDs |
| `expandedNodeIds` | `Set<string>` | Primary node IDs whose hidden children are currently shown |
| `userScale` | `number` | Current zoom level (`0` = auto-fit overview) |
| `panOffset` | `{ x, y }` | Current canvas translate when in user-controlled zoom |
| `isDragging` | `boolean` | Mouse/touch drag is in progress |
| `isInteracting` | `boolean` | Wheel zoom is in progress (suppresses CSS transition) |
| `viewport` | `{ w, h }` | Window dimensions (updated on resize) |

### Derived data (useMemo)

```
expandableNodeIds  ←  Set of primary node IDs that have at least one hidden child
visibleNodes       ←  primary nodes + hidden nodes whose parentPrimaryId ∈ expandedNodeIds
visibleEdges       ←  EDGES where both from and to are in visibleNodes
visibleNodeIds     ←  Set version of visibleNodes (used by overlay's incomingNodes)
incomingNodes      ←  edges pointing to activeNode, filtered to visibleNodeIds
```

### Camera

MapView uses the `MAP_CANVAS_H = 5500` canvas (vs `CANVAS_H = 4500` for StoryPage) to accommodate the foster care placement sub-tree that extends to y≈5000.

Two camera modes, both output a CSS `transform: translate(tx, ty) scale(s)` on the canvas div:

- **Overview** (`activeNodeId === null`):
  - `userScale === 0` → auto-fit: `scale = min(vw/CANVAS_W, vh/MAP_CANVAS_H) × 0.9`, centered
  - `userScale > 0` → user-controlled: uses `userScale` + `panOffset` directly
- **Focused** (`activeNodeId` set): node is translated to viewport centre; `scale = 1.0` (mobile: `0.7`)

CSS transition (`transform 1000ms cubic-bezier(0.25,1,0.5,1)`) is active during node-focus transitions and when the user is idle. It is suppressed to `'none'` during drag and wheel zoom to prevent lag.

### Free zoom / pan

**Scroll wheel zoom** is attached via `addEventListener('wheel', handler, { passive: false })` (not React's `onWheel`) so `e.preventDefault()` can block native page scroll. Zoom is toward the cursor using the formula:

```
newTx = mx - ((mx - curTx) / curScale) × newScale
```

**Mouse drag** and **touch drag** record a drag origin on `mousedown`/`touchstart`, then update `panOffset` by the delta on each `mousemove`/`touchmove`. Starting a drag while `userScale === 0` first locks in the auto-fit transform as explicit `userScale` + `panOffset` values.

A **Reset View** button appears in the nav bar when `userScale > 0`, and a **Collapse All** button appears when `expandedNodeIds.size > 0`.

### Hidden node expand / collapse

Primary nodes that have hidden children display a `+` / `−` badge in their top-right corner.

**Click behaviour on overview:**

```
Click primary node
  ├─ Has hidden children AND not yet expanded
  │    → Add to expandedNodeIds (hidden nodes appear); no overlay
  └─ Already expanded, or no hidden children
       → handleNodeSelect → zoom to node + open detail overlay
```

**Navigate to hidden node** (via overlay "Next Choices" / "Previous Steps"):
- `handleNodeSelect` auto-adds the node's `parentPrimaryId` to `expandedNodeIds` so the hidden node is visible before the camera zooms to it.

### Three-panel overlay

When a node is active, a full-screen overlay appears:

- **Left wing** — "Possible Previous Steps" computed from `incomingNodes` (reverse edge traversal, filtered to currently visible nodes).
- **Centre card** — Node title, description, and an "Expanded Detail" badge for hidden nodes.
- **Right wing** — "Next Choices" from `activeNode.choices`.

The overlay hides briefly during camera transitions (`scheduleOverlay` + 600ms) to avoid layout overlap mid-zoom.

### On-mount behaviour

On mount, `MapView` auto-zooms to `'start'` (300ms delay) and opens the overlay (900ms delay) so first-time visitors land on a node immediately. Both timeouts are cleaned up on unmount.

---

## 8. Shared config files

### `src/config/constants.ts`

```ts
export const CANVAS_W = 6700;          // canvas coordinate width (px) — shared
export const CANVAS_H = 4500;          // canvas height used by StoryPage
export const MAP_CANVAS_H = 5500;      // canvas height used by MapView (hidden nodes extend to y≈5000)
export const MOBILE_BREAKPOINT = 768;  // matches Tailwind 'md'
```

`StoryPage` uses `CANVAS_H`; `MapView` uses `MAP_CANVAS_H`. The taller map canvas accommodates the foster care placement sub-tree without affecting the StoryPage overview camera scale.

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

## 9. Visual builder UIs

Both builder tools are accessed from the **live dev site** (not deployed) — they write only to in-memory state and output downloadable JSON files. Changes must be downloaded and committed to replace the source files.

### Accessing the builders

The buttons are hidden in production; access via the dev server:

- **Story Builder** — triple-click the site title (top-left) on the story page.
- **Graph Editor** — open Story Builder first, then click **Graph Editor** in the top toolbar. Alternatively, triple-click the title while holding `Shift` if wired in App.tsx.

Both builders open as full-screen overlays. Click **← Back / ← Site** to return.

---

### Story Builder

Edits `story.json` (or any story config). Three-column layout:

| Panel | Purpose |
|-------|---------|
| **Left — Path** | Ordered list of node IDs in the story. Drag to reorder; click to select. |
| **Centre — Node Editor** | Story blocks + story images for the selected node. Blocks: add/edit/reorder `text`, `quote`, `callout`. Images: add/remove/reorder; enter the `/story-images/…` path and preview renders live. |
| **Right — Stats Library** | Browse all statistics for the selected node; click to insert a stat reference block. |

**Top toolbar:**
- **New** — start a blank story (discards current; prompts confirmation)
- **Import** — load a `.json` file to resume editing
- **↓ Download** — download the current story as `[id].json`
- **⎘ Copy** — copy JSON to clipboard
- **Preview** — opens a full read-only preview of the story in a modal overlay

> Work is not saved between browser sessions. Download regularly.

---

### Graph Editor

Edits `nodes.json` and `statistics.json` together. Left side = pan/zoom canvas; right side = inspector panel.

#### Canvas

| Interaction | Effect |
|------------|--------|
| Click a node | Opens the Node Inspector on the right |
| Drag a node | Repositions it; x/y coordinates update in real time |
| Scroll wheel | Zoom in/out (cursor-anchored) |
| Drag canvas background | Pan |
| Click **⊡ Reset View** | Returns to auto-fit overview |
| Click **+ Add Child** on a node | Opens the inline "Add Node" form with the parent pre-filled |
| Click **+ Connect →** in Inspector | Enter connect mode — then click the target node to add an edge |
| Click the midpoint `+` badge on an edge | Opens "Insert Node on Edge" form (splices a new node between two existing ones) |

**Connect mode** shows a dashed preview line from the source node to the cursor. A blue "✕ Cancel Connect" button appears in the header to exit without connecting.

**Constraint:** Hidden nodes may not connect to primary nodes — the UI will show an alert and cancel the operation. This preserves the rule that primary nodes are only reachable via other primary nodes.

#### Node Inspector (right panel)

Five sections for the selected node:

1. **Identity** — node ID (read-only), Delete button
2. **Basic fields** — title, description, category, icon (with live preview), icon color, canvas X/Y
3. **Node Type** — toggle between `primary` and `hidden`; hidden nodes require a Parent Primary Node ID
4. **Outgoing Choices** — edit choice labels and target nodes; ✕ removes the choice and its edge; `+ Add Choice` adds a blank; `+ Connect →` enters connect mode
5. **Statistics** — list of attached stats with ↑/↓ reorder and ✕ delete; `+ Add Stat` opens the Stat Form modal

#### Add Node form

Appears in the right panel when "+ Add Child" or the edge midpoint is clicked. Required fields: **Node ID** (lowercase/underscore only) and **Title**. Optional: Category, Node Type, canvas X/Y (pre-filled from parent). Click **Add Node** to commit; the new node is immediately selectable on the canvas.

#### Stat Form modal

Opens centered over the canvas when editing or creating a statistic:

- **Left** — scrollable form: chart type selector, type-specific fields, sources list
- **Right** — live chart preview (auto-updates on every keystroke; shows "Fill in required fields to see preview" if the data is incomplete)

Changing the chart type resets all fields to a blank template for that type. Click **Save** to commit, **Cancel** (or click the backdrop) to discard.

#### Downloading

Click **↓ Download Both** in the header. The browser will download two files:

```
nodes-YYYY-MM-DD.json
statistics-YYYY-MM-DD.json
```

Replace `src/data/config/nodes.json` and `src/data/config/statistics.json` with the downloaded files to persist changes.

---

## 10. Common editing tasks

### Edit story text for an existing node

Open `src/data/stories/story.json`. Find the `nodeContent[nodeId]` entry and edit `blocks` or `images`.

- **`blocks`** — text content: `text`, `quote`, `callout`, `image` (see §5 Layer 3)
- **`images`** — right-panel story images shown before statistics; files go in `public/story-images/`

Or use the **Story Builder** (triple-click the site title) and select the node — the Node Editor panel has both a block list and an **Images** section at the bottom.

### Add a new character story

1. Copy `src/data/stories/story.json` → `src/data/stories/[name].json`
2. Change `id` to a unique string (e.g. `"jose"`)
3. Update `character`, `intro`, `ending` (including `ending.actions` objects)
4. Set `path[]` to an ordered list of valid node IDs from `nodes.json`
5. Add `nodeContent[nodeId]` blocks for each node in `path`
6. In `App.tsx`, change the import:
   ```ts
   import storyJson from './data/stories/jose.json'; // swap the filename
   ```

> **Note:** The app always renders the file imported as `storyJson` in `App.tsx`. Only one story is active at a time.

### Edit node title, description, or position

Open `src/data/config/nodes.json`. Find the node by its key and edit the relevant fields. `x`/`y` are canvas coordinates (canvas is 6700×4500 — see coordinate guide in §5).

### Add a new statistic to a node

1. Add a new entry to `src/data/config/statistics.json` with a unique `id` and a valid `chart` schema (see §6)
2. Add that `id` to the node's `statisticIds` array in `nodes.json`

The stat appears automatically in the scroll experience. Order in `statisticIds` = order on screen.

### Add a new primary node to the flowchart

1. `src/data/config/nodes.json` — add a new entry under `nodes` with all required fields; omit `nodeType` (defaults to primary)
2. Set `x`/`y` to fit the primary canvas layout (see coordinate guide in §5)
3. Add directed edges to the `edges` array: `{ "from": "...", "to": "new-node-id" }`
4. Add `choices` entries in the nodes that should link to it
5. If using a new icon: add it to `src/config/iconRegistry.ts`
6. If using a new `category`: add to `NodeCategory` in `types.ts` and `categoryStyles.ts`

### Add hidden sub-nodes to an existing primary node

Hidden nodes provide expanded detail visible only in MapView when the user clicks the `+` badge on a primary node.

1. In `nodes.json`, add entries with `"nodeType": "hidden"` and `"parentPrimaryId": "target-primary-id"`
2. Position them near the parent (see hidden node zone guide in §5); they live outside the `4500` StoryPage canvas height so keep y ≥ 1200 and avoid overlap with primary nodes
3. Add edges connecting hidden nodes to each other and (at least one edge) from the primary node to a hidden node
4. Do **not** add hidden nodes to any story `path[]` — they are MapView-only
5. StoryPage automatically filters them out — no StoryPage changes needed

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

## 11. Key architectural decisions

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
| Narrative (`story.json`) | ✅ Yes | No — one per character | Each character has a different path and personal voice |

### No routing library

With two views, a `useState` in `App.tsx` is all that's needed. React Router would add ~15KB, a `BrowserRouter` wrapper, and route-matching logic for no user-visible benefit. The threshold to add a router is roughly 4+ distinct addressable views.

### Single `SCROLL_CONFIG` object

All scroll parameters are grouped at the top of `StoryPage.tsx` rather than spread throughout the JSX. When a designer says "the camera zooms in too fast", you change one number in one place rather than hunting for magic values.

### Content warning (`ContentWarning.tsx`)

A full-screen overlay shown before the story begins. All configurable text lives in `WARNING_CONFIG` at the top of `src/components/ContentWarning.tsx`:

```ts
const WARNING_CONFIG = {
  rememberDismissal: true, // false = show on every page load
  title:  'Content Warning',
  intro:  'This experience contains descriptions of:',
  topics: ['Family separation and child removal', ...],
  supportLinkUrl:   'https://www.bronxdefenders.org', // '' to hide
  supportLinkLabel: 'The Bronx Defenders',
  confirmLabel: 'I understand — Continue',
  exitUrl: '',  // set to a URL to show an exit button
} as const;
```

Dismissal state is stored in `localStorage` under the key `'family-policing-warning-dismissed'`. To reset (e.g. for testing), clear that key from DevTools → Application → Local Storage. The component renders `null` once dismissed, so there is no performance cost to leaving it mounted.

### Logo / branding (`StoryPage.tsx → BRANDING_CONFIG`)

Logo and partner line are configured in `BRANDING_CONFIG` at the top of `StoryPage.tsx`:

```ts
const BRANDING_CONFIG = {
  show:        true,
  logoSrc:     bronxDefendersLogo,  // imported from src/assets/bronx-defenders-logo.png
  logoAlt:     'The Bronx Defenders',
  partnerLine: 'The Bronx Defenders × PiTech',
} as const;
```

To swap the logo: drop the new file into `src/assets/` and either keep the filename `bronx-defenders-logo.png` (no code change needed) or update the import at the top of `StoryPage.tsx`.

---

## 12. Known issues & next steps

### Known issues

| Issue | Location | Notes |
|-------|----------|-------|
| No runtime validation of `statisticIds` | `storyNodes.tsx` | A missing stat ID silently drops the phase; no error thrown |
| No runtime validation of `edges` | `storyNodes.tsx` | A `nextNodeId` with no matching edge silently drops an SVG line |
| Touch pinch-zoom not implemented | `MapView.tsx` | Single-finger touch drag pans; two-finger pinch-zoom is not yet wired up |
| Keyboard navigation missing | Both views | No `aria-label`, no keyboard-accessible scroll triggers |
| No collapse-on-zoom for expanded groups | `MapView.tsx` | When zooming to a node inside an expanded sub-tree, sibling groups stay expanded |

### Possible next steps

- **Additional character stories** — copy `story.json`, change `path` and `nodeContent`, import in `App.tsx`
- **Shareable URLs** — encode active node history as a query param in `MapView`
- **Analytics** — PostHog or Mixpanel event on each phase transition and node expand
- **Accessibility pass** — `aria-label` on all interactive elements, keyboard-accessible node navigation in `MapView`
- **CMS integration** — replace `stories/` JSON files with Sanity or Contentful; `nodes.json` and `statistics.json` could stay local or move as well
- **New chart types** — add to `types.ts` union, implement renderer in `charts/`, register in `StatRenderer.tsx`
- **Touch pinch-zoom** — track two-finger distance in `onTouchMove` and update `userScale` proportionally

---

## Source material

- `story.md` — Original narrative brief from The Bronx Defenders
- `flowchart.md` — Canvas layout diagram and node coordinate reference
