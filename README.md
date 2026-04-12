# The Family Policing Machine

An interactive scrollytelling experience built in partnership with **The Bronx Defenders** and **Cornell Tech PiTech Studio**. Visitors follow a real family's journey through New York City's child protective services system — a scroll-driven narrative layered over a live system flowchart, with embedded data visualizations drawn from public records.

---

## Quick Start

```bash
npm install
npm run dev        # dev server → http://localhost:5173 (hot reload)
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally for QA
```

### Deploy

The build output in `dist/` is a fully static site — no server required. Drop it on Vercel, Netlify, or GitHub Pages.

**GitHub Pages** (sub-path deploy): set `VITE_BASE_URL` before building.

```bash
VITE_BASE_URL=/family-policing/ npm run build
```

Vercel and Netlify detect the `dist/` folder automatically with no extra config.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 (functional components + hooks) |
| Language | TypeScript 5 (strict mode) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |

No routing library. Two top-level views managed by a single `useState` in `App.tsx`.

---

## Project Structure

```
src/
├── App.tsx                   Top-level view router ('story' | 'map')
├── main.tsx                  React entry point
├── index.css                 Tailwind directives
├── types.ts                  All shared TypeScript interfaces
│
├── config/
│   ├── constants.ts          Shared numeric constants (canvas size, breakpoints)
│   └── categoryStyles.ts     Shared Tailwind class maps keyed by NodeCategory
│
├── components/
│   ├── StoryPage.tsx         Scroll-driven narrative experience (primary view)
│   └── MapView.tsx           Free-explore click-to-navigate map (secondary view)
│
└── data/
    ├── storyNodes.tsx        15-node system graph + EDGES (shared across all stories)
    ├── statistics.tsx        Visual stat components attached to nodes
    └── mariaStory.ts         Maria's narrative config (path + story text + ending)
```

---

## Architecture Overview

### Two views

`App.tsx` holds a single `currentView: 'story' | 'map'` state.

```
'story'  →  <StoryPage storyConfig={MARIA_STORY} onExploreMap={...} />
'map'    →  <MapView onBackToLanding={...} />
```

The "Explore Full Map" button in `StoryPage` (and the ending screen) switches to `'map'`.
The "Home" button in `MapView` returns to `'story'`.

### Three-layer data model

```
storyNodes.tsx          ← System graph (shared foundation)
    └── statistics.tsx  ← Visual stat components attached to nodes
mariaStory.ts           ← Character-specific narrative (path + story text)
```

**System graph** defines the institutional flowchart — all 15 nodes, their positions, descriptions, icons, choices, and attached statistics. This layer is shared by both views and by every story.

**Narrative config** (`StoryConfig`) defines one character's journey: which nodes they pass through, the personal story text for each node, and the ending screen. A new character = a new config file, no component changes needed.

**Statistics** are React components (charts, counters) attached to nodes in `storyNodes.tsx`. They appear as additional scroll phases in `StoryPage` after each node's story text.

---

## Config Files

### `src/config/constants.ts`

Shared numeric values used by both `StoryPage` and `MapView`.

```ts
export const CANVAS_W = 6700;          // canvas coordinate space width (px)
export const CANVAS_H = 4500;          // canvas coordinate space height (px)
export const MOBILE_BREAKPOINT = 768;  // matches Tailwind's `md` breakpoint
```

If you ever resize the canvas or change the responsive breakpoint, change it here — both views update automatically.

### `src/config/categoryStyles.ts`

Tailwind class maps keyed by `NodeCategory`. Used for node card borders, story card accents, and category labels in both views.

```ts
export const BORDER_COLOR: Record<NodeCategory, string>        // node card ring
export const CATEGORY_LABEL: Record<NodeCategory, string>      // text colour label
export const CATEGORY_LEFT_BORDER: Record<NodeCategory, string> // story card accent
```

**Node categories and their colours:**

| Category | Border | Used for |
|----------|--------|----------|
| `hotline` | yellow-400 | Initial call, SCR screening |
| `cares` | green-400 | CARES supportive track |
| `warning` | amber-400 | System traps / loop-back nodes |
| `investigation` | red-400 | ACS investigation track |
| `court` | red-700 | Article 10 court and all post-court nodes |
| `neutral` | neutral-500 | Dead ends, case closed |

To add a new category: add the value to `NodeCategory` in `types.ts`, then add an entry to each map in `categoryStyles.ts`.

---

## Data Files

### `src/data/storyNodes.tsx` — System Graph

The single source of truth for the institutional flowchart. Exports:

- `STORY_NODES` (default) — `Record<string, StoryNode>` — all 15 nodes
- `EDGES` (named) — `Edge[]` — all 15 directed connections

**`StoryNode` schema:**

```ts
interface StoryNode {
  id:          string;          // unique key — must match the object key
  title:       string;          // headline shown in both views
  description: string;          // system-level explanation (not character-specific)
  icon:        ReactElement;    // lucide-react icon
  x:           number;          // canvas center x (px)
  y:           number;          // canvas center y (px)
  category:    NodeCategory;    // controls colour in both views
  statistics?: NodeStatistic[]; // optional visual stat components (see statistics.tsx)
  choices:     Choice[];        // forward edges; empty = terminal node
}
```

**Canvas layout** (`6700 × 4500` px):

```
y ≈ 600–900   Better-outcome branches (screened out, CARES, unsubstantiated)
y ≈ 1100      Supervision endpoint (Maria's story ends here)
y ≈ 2000      Main horizontal spine (hotline → screening → assessment → investigation → court)
y ≈ 2950–3550 Removal branches (foster care, kinship, group home)
```

X spacing is ~650 px per depth column. Node cards are 260–320 px wide.

**`EDGES`:**

```ts
export const EDGES: Edge[] = [
  { from: 'start', to: 'scr_screening' },
  // ...
];
```

> **Keep in sync:** every `nextNodeId` in a `choices` array must also appear as an edge in `EDGES`. The EDGES array is used to draw the SVG bezier curves and to compute reverse traversal in `MapView`.

---

### `src/data/statistics.tsx` — Visual Statistics

React components that visualise system data. Each component is assigned to a node via the `statistics` field in `storyNodes.tsx`.

**`NodeStatistic` schema:**

```ts
interface NodeStatistic {
  id:        string;          // unique within its node
  component: ReactElement;    // the visual component (chart, counter, etc.)
  sources:   Source[];        // citation labels and optional URLs
}
```

In `StoryPage`, each `NodeStatistic` becomes one scroll phase (one screen of content) after the node's story text. A node with 2 statistics produces 2 stat phases. In `MapView`, statistics are not shown.

**Exported stat arrays** (assigned to nodes in `storyNodes.tsx`):

| Export | Assigned to |
|--------|-------------|
| `START_STATISTICS` | `start` |
| `SCR_SCREENING_STATISTICS` | `scr_screening` |
| `SAFETY_ASSESSMENT_STATISTICS` | `safety_assessment` |
| `CARES_TRACK_STATISTICS` | `cares_track` |
| `INVESTIGATION_STATISTICS` | `investigation` |
| `DETERMINATION_STATISTICS` | `determination` |
| `CASE_PLAN_STATISTICS` | `case_plan` |
| `COURT_FILING_STATISTICS` | `court_filing` |
| `COURT_HEARING_STATISTICS` | `court_hearing` |
| `SUPERVISION_ORDER_STATISTICS` | `supervision_order` |
| `FOSTER_CARE_REMOVAL_STATISTICS` | `foster_care_removal` |
| `KINSHIP_PLACEMENT_STATISTICS` | `kinship_placement` |
| `GROUP_HOME_STATISTICS` | `group_home` |

---

### `src/data/mariaStory.ts` — Character Narrative Config

Defines one character's journey. This file is JSON-serializable — no JSX, no React imports.

**`StoryConfig` schema:**

```ts
interface StoryConfig {
  id:          string;                              // unique story id (e.g. 'maria')
  title:       string;                              // human-readable title
  character: {
    name:       string;                             // hero headline
    summary:    string;                             // 1–2 sentence introduction
    heroImage?: string;                             // optional portrait URL
  };
  intro: {
    title:       string;                            // shown in the overview phase label
    description: string;                            // shown below summary on hero screen
  };
  path:        string[];                            // ordered node IDs this character navigates
  nodeContent: Record<string, { blocks: StoryContentBlock[] }>; // story text per node
  ending?: {
    title:       string;
    description: string;
    actions?:    string[];                          // optional call-to-action bullet list
  };
}
```

**`StoryContentBlock` union — content block types:**

| Type | Fields | Renders as |
|------|--------|------------|
| `text` | `title?: string`, `body: string` | Paragraph with optional bold heading |
| `quote` | `text: string`, `attribution?: string` | Italic pull-quote with red left border |
| `callout` | `text: string` | Amber-bordered callout box |
| `image` | `src: string`, `caption?: string`, `alt?: string` | Full-width image with caption |

---

## How-To Guides

### Create a new story

1. Copy `src/data/mariaStory.ts` to `src/data/[name]Story.ts`.
2. Change `id` to a unique string (e.g. `'jose'`).
3. Update `character`, `intro`, and `ending`.
4. Set `path[]` to an ordered list of node IDs from `storyNodes.tsx`.
   Valid IDs: `start`, `scr_screening`, `screened_out`, `safety_assessment`, `cares_track`, `investigation`, `determination`, `unsubstantiated`, `case_plan`, `court_filing`, `court_hearing`, `supervision_order`, `foster_care_removal`, `kinship_placement`, `group_home`.
5. Add a `nodeContent[nodeId]` entry for each node in your path. Nodes without an entry will show only the system description.
6. In `App.tsx`, import the new config and pass it to `<StoryPage storyConfig={...} />`.

### Add or edit a statistic

1. Open `src/data/statistics.tsx`.
2. Write a new React component (or edit an existing one).
3. Add it to the relevant exported array (e.g. `INVESTIGATION_STATISTICS`).
4. It will appear automatically as a scroll phase after the node's story text.

Each entry in the array adds one full-screen stat phase. Order within the array = order of scroll phases.

### Add a new node to the flowchart

1. Add a new entry to `STORY_NODES` in `src/data/storyNodes.tsx` with a unique key and all required fields.
2. Assign `x`/`y` coordinates that fit the canvas layout (see grid above).
3. Choose a `category` — add a new category to `types.ts` and `categoryStyles.ts` if needed.
4. Add edges to `EDGES` connecting the new node to existing ones.
5. Add a `choices` entry in the node(s) that should link to it.
6. Optionally attach statistics via the `statistics` field.

### Edit or remove an existing node

**Edit:** Find the node by key in `STORY_NODES`. Change `title`, `description`, `choices`, or any other field freely. Changing `x`/`y` repositions it on the canvas.

**Remove:**
1. Delete the entry from `STORY_NODES`.
2. Remove all `EDGES` entries where `from` or `to` equals the deleted ID.
3. Remove any `choices` entries in other nodes that reference the deleted ID.
4. Remove it from any `path[]` in story config files.

### Tune the scroll experience

All scroll pacing, camera zoom levels, overlay opacity, and layout geometry are controlled by `SCROLL_CONFIG` at the top of `src/components/StoryPage.tsx`. Change a value and the dev server hot-reloads instantly.

```ts
const SCROLL_CONFIG = {
  phaseHeights: {
    hero:     1.5,   // × viewport height per phase — larger = slower scroll feel
    overview: 1.0,
    focus:    1.0,
    story:    1.2,
    stat:     1.0,
    ending:   1.2,
  },
  cam: {
    overviewFit: 0.88,  // fraction of viewport filled in overview
    focusScale:  0.48,  // canvas scale when zoomed to a node (focus phase)
    storyScale:  0.60,  // canvas scale when the story card is visible
  },
  overlay: {
    hero:       0.92,   // dark overlay opacity per phase (0 = transparent, 1 = black)
    overview:   0.06,
    focusStart: 0.12,
    focusEnd:   0.55,
    story:      0.82,
    stat:       0.80,
    ending:     0.95,
  },
  transitions: {
    overlay:     '600ms ease',
    screenFade:  '600ms ease',
    cardSlide:   '500ms cubic-bezier(0.25,1,0.5,1)',
    progressBar: '500ms ease-out',
  },
  layout: {
    cardMaxPx:         540,   // max story card width (px)
    cardFraction:      0.46,  // story card width as fraction of viewport width
    cardStatLeftFrac:  0.03,  // card left edge position when stat panel is visible
    statPanelLeftFrac: 0.50,  // stat panel left edge position
    // ...
  },
  statAnim: {
    enterZone:     0.25,  // first 25% of stat phase = entrance (slide up + fade in)
    exitZone:      0.75,  // last 25% of stat phase = exit (slide further up + fade out)
    enterOffsetPx: 64,    // starting translateY offset (px below resting position)
    exitOffsetPx:  32,    // ending translateY offset (px above resting position)
  },
}
```

---

## Types Reference (`src/types.ts`)

```ts
type NodeCategory = 'hotline' | 'cares' | 'warning' | 'investigation' | 'court' | 'neutral'

interface StoryNode      // one node in the system flowchart
interface Edge           // { from: string; to: string }
interface NodeStatistic  // { id, component, sources[] }
interface StoryConfig    // one character's full narrative configuration
type StoryContentBlock   // text | quote | callout | image
```

---

## Roadmap

- **Headless CMS** — Move `STORY_NODES` and story configs to Sanity / Contentful so researchers can update copy without touching code.
- **Analytics** — PostHog / Mixpanel event tracking on node selection and path completion.
- **Shareable URLs** — Encode `history` as a query parameter for path replay.
- **Accessibility** — `aria-label`, keyboard navigation (arrow keys on graph), focus management.
- **Mobile map pan** — Touch-drag pan for the overview map in `MapView`.
