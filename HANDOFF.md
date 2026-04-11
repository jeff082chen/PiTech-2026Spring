# The Family Policing Machine — Developer Handoff

**Client:** The Bronx Defenders × Cornell Tech PiTech Studio
**Project type:** Scrollytelling web experience
**Purpose:** Guide visitors through the real journey of a family pulled into NYC's child protective services system, using a cinematic scroll-driven narrative combined with a live system flowchart and data visualizations drawn from public records and investigative reporting.

---

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Project structure](#2-project-structure)
3. [How the scroll experience works](#3-how-the-scroll-experience-works)
4. [Data architecture](#4-data-architecture)
5. [Editing Maria's story](#5-editing-marias-story)
6. [Adding a new story](#6-adding-a-new-story)
7. [Adding or editing statistics](#7-adding-or-editing-statistics)
8. [Editing the system flowchart](#8-editing-the-system-flowchart)
9. [The free-explore map](#9-the-free-explore-map)
10. [Tuning the scroll experience](#10-tuning-the-scroll-experience)
11. [Key decisions and why](#11-key-decisions-and-why)
12. [Known issues and next steps](#12-known-issues-and-next-steps)
13. [Source material](#13-source-material)
14. [Deprecated files](#14-deprecated-files)

---

## 1. Getting started

### Prerequisites
- Node.js 18+
- npm

### Commands

```bash
npm install        # install dependencies
npm run dev        # dev server → http://localhost:5173 (hot reload)
npm run build      # production build: runs tsc then vite
npm run preview    # serve the production build locally for QA
```

### Tech stack

| Tool | Version | Role |
|---|---|---|
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Vite | 5 | Dev server + build |
| Tailwind CSS | 3 | Styling (utility-first) |
| Lucide React | latest | Icons |

No backend. No database. No routing library. This is a fully static single-page app.

---

## 2. Project structure

```
src/
├── App.tsx                  Entry point — two-mode router (story / map)
├── types.ts                 All shared TypeScript interfaces
│
├── components/
│   ├── StoryPage.tsx        The scroll-driven experience (primary view)
│   └── MapView.tsx          Free-explore click-to-navigate map (secondary view)
│
└── data/
    ├── storyNodes.tsx       The 15-node system graph + EDGES
    ├── statistics.tsx       Visual stat components assigned to nodes
    └── mariaStory.ts        Maria's narrative config (path + story text)

story.md                     Original narrative brief from The Bronx Defenders
REFACTOR_PLAN.md             Architectural decisions and implementation log
HANDOFF.md                   This file
```

### App.tsx routing

`App.tsx` holds a single `currentView: 'story' | 'map'` state. No library needed.

- Default view is `'story'` → renders `<StoryPage storyConfig={MARIA_STORY} onExploreMap={...} />`
- "Explore Full Map" button in StoryPage → switches to `'map'` → renders `<MapView onBackToLanding={...} />`
- "Home" button in MapView → switches back to `'story'`

To add a second story character, you would add a story selector here and pass the chosen `StoryConfig` to `<StoryPage>`.

---

## 3. How the scroll experience works

`StoryPage.tsx` uses a **scroll-driven state machine** — the visible screen is `position: sticky`, never scrolls itself, but lives inside a tall outer `div` whose height equals the total scroll distance. Scroll position is read by a `requestAnimationFrame`-throttled listener.

### Phase system

The page is divided into **phases** — discrete scroll segments, each with a type, a `startY`, a `height`, and two camera **keyframes** (`camStart`, `camEnd`).

`buildPhases(storyConfig, vh)` generates the full list once, deterministically, from the story path and current viewport height.

**Phase sequence for Maria's story (9 nodes, 15 statistics):**

```
hero          × 1    Title screen
overview      × 1    Full flowchart visible (zoomed out)
  [per node in path, 9 nodes]:
    node-focus  × 1  Camera zooms in on node; focus hint visible
    node-story  × 1  Story card appears, map dimmed
    node-stat   × N  [one per statistic on this node]
                     Story card slides left; stat panel appears right
ending        × 1    End screen
─────────────────
Total phases: ~38 phases, ~32 screen-heights of scroll
```

**Phase heights** are controlled by `PH` at the top of `StoryPage.tsx`:

```typescript
const PH = { hero: 1.5, overview: 1.0, focus: 1.0, story: 1.2, stat: 1.0, ending: 1.2 }
```

Each value is a multiplier of `vh` (viewport height). Increase to slow down that phase type.

### Scroll-driven camera

This is the most important architectural decision: the flowchart canvas has **no CSS transition**. Instead:

1. Each phase carries `camStart` and `camEnd` — two `CameraKF` keyframes:
   ```typescript
   interface CameraKF { nodeId: string | null; scale: number }
   ```
   `nodeId: null` means "overview" (fit entire 6700×4500 canvas in viewport).

2. `resolveCam(kf, vw, vh)` converts a keyframe to `{tx, ty, scale}` in pixels.

3. Progress `t = (scrollY - phase.startY) / phase.height` runs from 0→1 across the phase. It is eased with `easeInOut(t)`.

4. Camera is linearly interpolated: `lerp(from.tx, to.tx, te)` etc., recalculated every RAF tick.

5. The result is applied directly as `transform: translate(${tx}px, ${ty}px) scale(${scale})` — **no CSS transition on the canvas element**.

This means the camera movement is exactly proportional to scroll speed. Fast scroll = fast camera. The viewer is always in full control.

**Camera scales used:**

| Phase | Scale | Effect |
|---|---|---|
| overview / hero / ending | fit-to-viewport × 0.88 | Full canvas visible |
| node-focus | 0.48 | Node is large, context visible |
| node-story / node-stat | 0.60 | Slightly closer; node prominent |

Going from one node's `node-stat` (scale 0.60) to the next `node-focus` (scale 0.48) creates the "zoom out + pan sideways to next node" cinematic effect automatically, because `camStart` of the new focus phase is set to `prevCamEnd` from the previous phase.

### Dark overlay

A `bg-neutral-950` div sits above the canvas and has its `opacity` driven by the phase type, with a CSS `600ms ease` transition:

| Phase | Overlay opacity |
|---|---|
| hero | 0.92 |
| overview | 0.06 |
| node-focus | lerp(0.12 → 0.55, t) — darkens as you scroll in |
| node-story | 0.82 |
| node-stat | 0.80 |
| ending | 0.95 |

### Story card layout

The story card is a **fixed width** (`min(540px, 46vw)` on desktop, `90vw` on mobile) that slides horizontally using CSS `left` position — never resizes. This prevents text reflow.

- `node-story`: card is centered at `(vw - CARD_W) / 2`
- `node-stat`: card slides to `vw * 0.03` (left-anchored)
- Stat panel appears at `vw * 0.50 + 16px` via `translateX` animation

### Layer stack (bottom → top inside the sticky viewport)

```
1  Flowchart canvas     6700×4500 px; scroll-driven transform; no CSS transition
2  Dark overlay         opacity per phase type; CSS 600ms ease transition
3  Hero screen          opacity 1 only in 'hero' phase
4  Overview label       opacity 1 only in 'overview' phase
5  Node-focus hint      opacity 1 only in 'node-focus' phase (with 150ms delay)
6  Story card           fixed-width; slides left on stat phase
   Stat panel           slides in from right on stat phase (desktop only)
   Mobile stat panel    stacked below story card on mobile
7  Ending screen        opacity 1 only in 'ending' phase
8  Nav + progress bar   always visible; progress = phaseIndex / (phases.length - 1)
```

---

## 4. Data architecture

There are three completely independent data layers for each node. Keeping them separate lets statistics have full React components without polluting the story text, and lets story text be JSON-serializable.

### Layer 1 — System graph (`src/data/storyNodes.tsx`)

Defines the 15 institutional nodes and 15 directed edges of the system flowchart. This is the shared foundation — all stories use the same graph.

```typescript
interface StoryNode {
  id: string;
  title: string;
  description: string;    // institutional explanation, neutral tone
  icon: ReactElement;     // Lucide icon
  x: number;             // canvas position (6700×4500 coordinate space)
  y: number;
  category: NodeCategory; // 'hotline' | 'cares' | 'warning' | 'investigation' | 'court' | 'neutral'
  statistics?: NodeStatistic[];
  choices: Choice[];      // forward edges (used by MapView)
}
```

**The 15 nodes:**

| ID | Title | Category | Position (x, y) |
|---|---|---|---|
| `start` | Call to SCR Hotline | hotline | 350, 2000 |
| `scr_screening` | SCR Screening | hotline | 1000, 2000 |
| `screened_out` | Call Screened Out | neutral | 1000, 600 |
| `safety_assessment` | Safety Assessment | neutral | 1650, 2000 |
| `cares_track` | CARES — Supportive Track | cares | 2300, 800 |
| `investigation` | ACS Investigation | investigation | 2300, 2000 |
| `determination` | Investigation Finding | investigation | 2950, 2000 |
| `unsubstantiated` | Case Closed — Unfounded | neutral | 2950, 700 |
| `case_plan` | Voluntary Service Agreement | investigation | 3600, 2000 |
| `court_filing` | ACS Files a Court Petition | court | 4250, 2000 |
| `court_hearing` | Family Court Hearing | court | 4900, 2000 |
| `supervision_order` | Court Supervision Order | court | 5550, 1100 |
| `foster_care_removal` | Child Removed — Placed in ACS Custody | court | 5550, 2950 |
| `kinship_placement` | Kinship Placement | court | 6200, 2400 |
| `group_home` | Foster Care or Group Home Placement | court | 6200, 3550 |

**Canvas layout logic:**
- Main spine runs horizontally at y ≈ 2000
- Better outcomes branch upward (y ≈ 600–900)
- Supervision endpoint at y ≈ 1100
- Removal track branches downward (y ≈ 2950–3550)

### Layer 2 — Statistics (`src/data/statistics.tsx`)

Rich visual components (charts, counters, comparisons). Each is a `NodeStatistic`:

```typescript
interface NodeStatistic {
  id: string;
  component: ReactElement;   // full visual — dark-panel styled
  sources: Source[];         // { label: string; url?: string }[]
}
```

These are React components and **not JSON-serializable**. They live in `statistics.tsx` and are assigned to nodes via the `statistics: NODE_STATISTICS` field in `storyNodes.tsx`.

**Statistics → node mapping:**

| Export | Components | Node |
|---|---|---|
| `START_STATISTICS` | `PipelineVisual` (funnel), `SCRCounterVisual` (95,590 calls) | `start` |
| `SCR_SCREENING_STATISTICS` | `BarChartVisual` (NY 75% vs national), `AnonymousTipsVisual` (6.7% vs 22.5%), `CaseVolLineVisual` (2004–2023) | `scr_screening` |
| `SAFETY_ASSESSMENT_STATISTICS` | `WarrantBoxVisual` (<0.2% warrant rate), `InvestigatorQuotesVisual` | `safety_assessment` |
| `CARES_TRACK_STATISTICS` | `CARESTrendVisual` (4% → 22%) | `cares_track` |
| `INVESTIGATION_STATISTICS` | `RaceRatesVisual` (44/43/19%) | `investigation` |
| `DETERMINATION_STATISTICS` | `DragnetVisual`, `RecordDurationVisual` (28 years) | `determination` |
| `CASE_PLAN_STATISTICS` | `CoercedComplianceVisual` (9 in 10) | `case_plan` |
| `COURT_FILING_STATISTICS` | `GeographyVisual` (BX04 vs BK06) | `court_filing` |
| `COURT_HEARING_STATISTICS` | `MariannaTwoNightsVisual`, `DurationVisual` (18 months) | `court_hearing` |
| `SUPERVISION_ORDER_STATISTICS` | `SupervisionRenewalVisual` (1 in 3) | `supervision_order` |
| `FOSTER_CARE_REMOVAL_STATISTICS` | `CostVisual` ($107K vs $3.6K), `MarginalCasesVisual` (3×) | `foster_care_removal` |
| `KINSHIP_PLACEMENT_STATISTICS` | `KinshipSupportGapVisual` | `kinship_placement` |
| `GROUP_HOME_STATISTICS` | `OutcomesVisual` (outcomes grid), `PlacementInstabilityVisual` (1 in 4) | `group_home` |

### Layer 3 — Story config (`src/data/mariaStory.ts`)

Maria's narrative layer. Pure TypeScript data — no JSX. Can be replaced by a JSON import in future.

```typescript
interface StoryConfig {
  id: string;
  title: string;
  character: { name: string; summary: string; heroImage?: string }
  intro:     { title: string; description: string }
  path:      string[]                              // ordered nodeId list
  nodeContent: Record<string, { blocks: StoryContentBlock[] }>
  ending?:   { title: string; description: string }
}
```

`path` is Maria's route through the system graph: `['start', 'scr_screening', 'safety_assessment', 'investigation', 'determination', 'case_plan', 'court_filing', 'court_hearing', 'supervision_order']`

---

## 5. Editing Maria's story

Open [src/data/mariaStory.ts](src/data/mariaStory.ts). No React knowledge needed.

Each node in `nodeContent` has a `blocks` array. Add, remove, or reorder blocks freely.

**Block types:**

```typescript
// Paragraph — optional bold heading above
{ type: 'text', title?: string, body: string }

// Pull quote — italic, red left border, optional attribution footer
{ type: 'quote', text: string, attribution?: string }

// Callout box — amber border, highlights systemic context
{ type: 'callout', text: string }

// Image — with optional caption
{ type: 'image', src: string, caption?: string, alt?: string }
```

**Example — adding a new quote to the investigation node:**

```typescript
investigation: {
  blocks: [
    {
      type: 'text',
      title: 'Under Investigation',
      body: 'ACS determines the case warrants...',
    },
    {
      type: 'quote',
      text: 'New quote here.',
      attribution: 'Maria',
    },
    // existing blocks continue...
  ],
},
```

The **system description** ("How the system works" grey box) comes from `storyNodes.tsx` and is shared — edit it there, not in `mariaStory.ts`.

Statistics are also separate — they appear automatically after the story text as additional scroll phases. They cannot be modified from `mariaStory.ts`.

---

## 6. Adding a new story

1. **Copy** `src/data/mariaStory.ts` → e.g. `src/data/joseStory.ts`
2. **Change** `id` (e.g. `'jose'`) and update `character`, `intro`, `ending`
3. **Set** `path[]` to the route this character takes. Must use valid node IDs (see table in §4)
4. **Fill in** `nodeContent` for each node in the path
5. **Export** e.g. `export const JOSE_STORY: StoryConfig = { ... }`
6. **Wire up** in `App.tsx`:

```typescript
import { JOSE_STORY } from './data/joseStory';

// In App.tsx, add a story selector or simply replace MARIA_STORY:
<StoryPage storyConfig={JOSE_STORY} onExploreMap={() => setCurrentView('map')} />
```

The scroll experience, camera, phases, and statistics are all driven from the `storyConfig` prop — no other changes needed.

---

## 7. Adding or editing statistics

Open [src/data/statistics.tsx](src/data/statistics.tsx).

**To add a new statistic to an existing node:**

1. Create a new function component with dark-panel styling (use existing components as reference — all use `bg-neutral-900`, `text-neutral-400`, etc.)
2. Add it to the relevant `*_STATISTICS` export array:

```typescript
export const INVESTIGATION_STATISTICS: NodeStatistic[] = [
  {
    id: 'race_rates',
    component: <RaceRatesVisual />,
    sources: [{ label: 'NYC ACS Annual Report 2021', url: 'https://...' }],
  },
  // Add new entry here:
  {
    id: 'your_new_stat',
    component: <YourNewVisual />,
    sources: [{ label: 'Source name', url: 'https://...' }],
  },
];
```

Each statistic in the array automatically generates one additional `node-stat` scroll phase. Two statistics on a node = two separate scroll phases with the stat panel cycling between them (dot indicators show position).

**Shared primitives available in statistics.tsx:**

```typescript
<StatLabel>Descriptive label text</StatLabel>   // small grey uppercase header
<StatCard stat="44%" label="of Black children investigated" />  // big-number card
```

---

## 8. Editing the system flowchart

Open [src/data/storyNodes.tsx](src/data/storyNodes.tsx).

### Moving a node

Change the `x` and `y` values. The canvas is 6700 × 4500 px. The main horizontal spine runs at y ≈ 2000. Positive x = rightward, positive y = downward.

```typescript
supervision_order: {
  x: 5550, y: 1100,   // change these
  ...
}
```

### Adding a new node

1. Add a new entry to `STORY_NODES` in `storyNodes.tsx` with a unique ID, position, category, icon, description, and `choices: []`
2. Add the corresponding edge(s) to the `EDGES` array
3. Optionally create statistics for it in `statistics.tsx`
4. The node is immediately visible in MapView and can be added to any story's `path[]`

### Edge rendering

Edges are cubic bezier curves: `M x1 y1 C (x1+200) y1, (x2-200) y2, x2 y2`. The ±200 handle length works well for horizontal connections. Adjust if nodes are closer together or at steep angles.

**Edge visual states:**
- Both endpoints in story `path[]` → red stroke, opacity 0.8
- Otherwise → grey stroke, opacity 0.3

**Node visual states:**
- Active (camera is centred on it) → opacity 100%, scale 110%, red ring
- Visited (earlier in path) → opacity 35%
- Upcoming on path → opacity 60%
- Off-path → opacity 15%, greyscale

---

## 9. The free-explore map

`MapView.tsx` is the secondary experience, accessible via "Explore Full Map". It is **completely independent** of `StoryPage` and can be modified without risk.

**How it works:**
- Same 15-node graph, same edge rendering, same camera transform math
- `activeNodeId` state drives the camera (same `translate/scale` approach)
- On mount: 300ms delay → zoom to `start` node; 900ms delay → show info overlay
- Info overlay: center card (description) + left wing (incoming nodes) + right wing (next choices)
- History dropdown tracks visited nodes; "Full Map" button resets to overview

**What MapView does NOT have:**
- Statistics panels (removed in the refactor — stats live in StoryPage now)
- FactModal (deleted — replaced by inline stats)

---

## 10. Tuning the scroll experience

### Phase heights

In `StoryPage.tsx` line 11:

```typescript
const PH = { hero: 1.5, overview: 1.0, focus: 1.0, story: 1.2, stat: 1.0, ending: 1.2 }
```

Increase any value to give that phase type more scroll time (slower / more deliberate). Decrease to speed up. Changes apply to all instances of that phase type across the whole story.

### Camera scales

In `buildPhases()` around line 73:

```typescript
const focusKF: CameraKF = { nodeId, scale: 0.48 };  // how zoomed in on focus
const storyKF: CameraKF = { nodeId, scale: 0.60 };  // how zoomed in on story/stat
```

Higher scale = more zoomed in. For comparison, `MapView` uses scale 1.0 at full zoom.

### Overlay opacity

In the `overlayOpacity` computation (~line 241). Tune values to make the map more or less visible in each phase.

### Story card position

```typescript
const cardLeft = !isMobile && isStat
  ? vw * 0.03      // left anchor on stat phase — increase to move card rightward
  : (vw - CARD_W) / 2;  // centred

const statLeft = vw * 0.50 + 16;  // stat panel left edge — adjust to change gap
```

---

## 11. Key decisions and why

**No CSS transition on the canvas**
The camera is interpolated per-frame in JavaScript, not animated with CSS transitions. This makes camera movement directly scroll-proportional — the viewer is always in control of the speed. CSS transitions would create an "autopilot" feel where the camera keeps moving after the user stops scrolling.

**Fixed-width story card**
Earlier versions resized the card from 100% → 50% width when the stat panel appeared. This caused text reflow on every character. The current approach: card has a fixed pixel width, slides horizontally via `left`. No reflow.

**Three separate data layers**
`storyNodes.tsx` (graph), `statistics.tsx` (React components), `mariaStory.ts` (story text). These are intentionally separate because:
- Statistics need JSX and can't be in a JSON file
- Story text should be editable without React knowledge
- Multiple stories reuse the same graph and statistics untouched

**No routing library**
A single `currentView` state in `App.tsx` is sufficient. Adding React Router would add complexity with no benefit for two views.

**LandingPage deprecated, not deleted**
`src/components/LandingPage.tsx` is kept but not rendered. Its visual components were ported to `statistics.tsx`. Deleting it is safe whenever.

---

## 12. Known issues and next steps

### Issues

- **Mobile stat experience is basic** — On mobile, the stat panel stacks below the story card in the lower 50% of screen. With long stat components this can overflow. A carousel or modal would be better.
- **No scroll restoration** — If the user navigates to MapView and back, they return to the top of StoryPage. The scroll position is lost.
- **Stat panel on narrow desktop** — At viewport widths 768–900px, the two-column split is tight. The card/stat widths may need adjustment for mid-size screens.

### Suggested next steps

1. **Story selector** — Add a second story character (Jose / Dayanara / Ebony). The data architecture is ready; only `App.tsx` needs a story chooser UI and a new `*Story.ts` file.
2. **Interactive map improvements** — The MapView flowchart currently uses click-to-navigate. The `description` text is all that's shown; statistics could be added here too.
3. **Choropleth map** — `story.md` calls for a map of NYC community districts showing SCR intake rates by neighbourhood (BX04 vs BK06). This would be a new statistic component using a mapping library (Mapbox GL JS or react-simple-maps).
4. **Sankey diagram** — `story.md` calls for a full-pipeline Sankey from hotline calls through removal, coloured by race. This would replace or augment `PipelineVisual`.
5. **Real data for the counter** — `SCRCounterVisual` shows static numbers. Animating the counter on first view (counting up from 0) would increase emotional impact.
6. **Action items in ending** — The "What Can Be Done" section in the ending screen currently has placeholder text. Replace with real links and resources from The Bronx Defenders.
7. **Accessibility** — No skip-navigation links, no ARIA live regions for scroll phase changes. Screen reader experience is currently poor.

---

## 13. Source material

All data and narrative content is drawn from:

- **NYC ACS Annual Reports** (2021–2024) — investigation rates, race breakdowns, CARES track growth, foster care census
- **The Bronx Defenders: "This Wound Is Still Fresh"** — CARES track coercion, Dayanara's story, documented investigator tactics
- **ProPublica investigative reporting on ACS** — warrant rate analysis, pull quotes
- **Doyle (2007, 2008)** — marginal cases research; foster care placement and adult outcomes
- **Family Court filing data by community district (FY 2023)** — BX04 vs BK06 comparison
- **NYC DHS shelter utilization data** — foster care alumni in homeless shelters

The full narrative brief and visualization guide is in [story.md](story.md) in the project root. Read this before making content decisions — it explains the intended emotional arc and data framing in detail.

---

## 14. Deprecated files

| File | Status | Notes |
|---|---|---|
| `src/components/LandingPage.tsx` | Kept, not rendered | All visual components ported to `statistics.tsx`. Safe to delete. |
| `src/components/FactModal.tsx` | **Deleted** | Was a modal showing node `fact` field. Replaced by inline stats panels. The `fact` field has been removed from `StoryNode`. |
