# The Family Policing Machine

An interactive scrollytelling experience built in partnership with **The Bronx Defenders** and **Cornell Tech PiTech Studio**. Visitors follow a real family's journey through New York City's child protective services system — a scroll-driven narrative layered over a live system flowchart, with embedded data visualizations drawn from public records.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Editing Content Without Code](#editing-content-without-code)
   - [Editing Story Text](#editing-story-text-srcdatastoriesmariajson)
   - [Editing Statistics](#editing-statistics-srcdataconfigstatisticsjson)
   - [Editing Nodes](#editing-nodes-srcdataconfignodesjson)
6. [Statistics Chart Types](#statistics-chart-types)
7. [Developer Guides](#developer-guides)
   - [Add a New Statistic](#add-a-new-statistic)
   - [Add a New Story Character](#add-a-new-story-character)
   - [Add or Edit a Flowchart Node](#add-or-edit-a-flowchart-node)
   - [Add a New Chart Type (Escape Hatch)](#add-a-new-chart-type-escape-hatch)
   - [Add a New Icon](#add-a-new-icon)
   - [Tune the Scroll Experience](#tune-the-scroll-experience)
8. [Reference Tables](#reference-tables)
   - [Icon Registry](#icon-registry)
   - [AccentColor Reference](#accentcolor-reference)
   - [Node ID Reference](#node-id-reference)
9. [Types Reference](#types-reference)
10. [Roadmap](#roadmap)

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
├── App.tsx                        Top-level view router ('story' | 'map')
├── main.tsx                       React entry point
├── index.css                      Tailwind directives
├── types.ts                       All shared TypeScript interfaces
│
├── config/
│   ├── constants.ts               Canvas dimensions (CANVAS_W/H, MAP_CANVAS_H), breakpoints
│   ├── categoryStyles.ts          Tailwind class maps keyed by NodeCategory
│   └── iconRegistry.ts            String → lucide-react component lookup table
│
├── data/
│   ├── storyNodes.tsx             Adapter: nodes.json + statistics.json → StoryNode[]
│   ├── config/
│   │   ├── nodes.json             ← EDIT HERE: 37 nodes (15 primary + 22 hidden) + 37 edges
│   │   └── statistics.json        ← EDIT HERE: all 21 stat charts (declarative schema)
│   └── stories/
│       └── maria.json             ← EDIT HERE: Maria's story text, path, intro, ending
│
└── components/
    ├── StoryPage.tsx              Scroll-driven narrative experience (primary view)
    ├── MapView.tsx                Free-explore map: zoom/pan + expand hidden nodes
    ├── builder/                   Visual story editor (StoryBuilder UI)
    │   ├── StoryBuilder.tsx
    │   ├── BlockEditor.tsx
    │   ├── MetadataEditor.tsx
    │   ├── NodeEditor.tsx
    │   ├── PathBuilder.tsx
    │   ├── PreviewPane.tsx
    │   ├── StatsLibrary.tsx
    │   └── MapEditorModal.tsx
    └── charts/
        ├── StatRenderer.tsx       Dispatch: chart.type → correct renderer component
        ├── accentMap.ts           AccentColor token → Tailwind class lookup tables
        ├── BigNumber.tsx          Renderer: big-number
        ├── TwoCounter.tsx         Renderer: two-counter
        ├── Pipeline.tsx           Renderer: pipeline
        ├── BarCompare.tsx         Renderer: bar-compare
        ├── CardCompare.tsx        Renderer: card-compare (stat + district variants)
        ├── HorizontalBars.tsx     Renderer: horizontal-bars
        ├── StackedBars.tsx        Renderer: stacked-bars
        ├── QuoteList.tsx          Renderer: quote-list
        ├── HighlightCallout.tsx   Renderer: highlight-callout
        ├── GridCards.tsx          Renderer: grid-cards
        ├── CostCompare.tsx        Renderer: cost-compare
        ├── TimelineBar.tsx        Renderer: timeline-bar
        ├── LineChart.tsx          Renderer: line-chart
        ├── customRegistry.ts      componentId string → custom component lookup
        └── custom/
            ├── WarrantBox.tsx     Bespoke: warrant rate area chart
            └── PlacementInstability.tsx  Bespoke: figure silhouettes
```

### What lives where

| You want to change… | Edit this file |
|---------------------|---------------|
| Story text, quotes, callouts | `src/data/stories/maria.json` |
| A statistic's numbers or chart data | `src/data/config/statistics.json` |
| A node's title, description, icon, position | `src/data/config/nodes.json` |
| Which statistics appear on a node | `src/data/config/nodes.json` → `statisticIds` |
| Node category colours | `src/config/categoryStyles.ts` |
| Scroll pacing, zoom levels, transitions | `src/components/StoryPage.tsx` → `SCROLL_CONFIG` |
| A new story character | New file in `src/data/stories/` |
| A completely new chart type | New file in `src/components/charts/` |

---

## Architecture Overview

### Two views

`App.tsx` holds a single `currentView: 'story' | 'map'` state.

```
'story'  →  <StoryPage storyConfig={MARIA_STORY} onExploreMap={...} />
'map'    →  <MapView onBackToLanding={...} />
```

### Three-layer data model

```
src/data/config/nodes.json       ← Layer 1: system graph (nodes, edges, positions)
         │
         └── statisticIds[]  →  src/data/config/statistics.json  ← Layer 2: chart data
                                         │
                                         └── StatRenderer → BigNumber / Pipeline / ...

src/data/stories/maria.json      ← Layer 3: character-specific narrative
```

**Layer 1 — System graph** defines the institutional flowchart: **37 nodes** (15 primary + 22 hidden) and **37 directed edges**. Primary nodes are shared by both views and all stories. Hidden nodes have `nodeType: "hidden"` and a `parentPrimaryId`; they are invisible in StoryPage and collapsed by default in MapView — users expand them by clicking the `+` badge on a primary node.

**Layer 2 — Statistics** is a declarative JSON registry of all 21 stat entries. Each entry has a `chart` object with a `type` field; `StatRenderer` reads the type and dispatches to the correct renderer component. The renderer turns JSON data into a React visual — no JSX in the data file.

**Layer 3 — Story config** (`StoryConfig`) defines one character's journey: which nodes they pass through (`path[]`), the personal story text for each node (`nodeContent`), and the intro/ending screens. A new character = a new JSON file, zero component changes. Story paths use only primary nodes.

### Runtime data flow

```
nodes.json
    │  cfg.icon (string) ──────────────────→ ICON_REGISTRY → <LucideIcon />
    │  cfg.statisticIds[] ─→ statistics.json → StatRenderer → chart renderers
    └─────────────────────────────────────────────────────────→ StoryNode[]

stories/maria.json ──────────────────────────────────────────→ StoryPage
                                             path[] → node sequence
                                             nodeContent → story card text
                                             character/intro/ending → screens
```

---

## Editing Content Without Code

The following sections are written for researchers and content editors at The Bronx Defenders who need to update text or data without touching React code.

---

### Editing Story Text — `src/data/stories/maria.json`

This file controls everything a visitor reads during the scrollytelling experience.

#### Top-level fields

```jsonc
{
  "id": "maria",
  "title": "Maria's Story",

  "character": {
    "name": "Maria",
    "summary": "Maria is a single mother of two in the South Bronx..."
  },

  "intro": {
    "title": "A Call That Changes Everything",
    "description": "In New York City, over 196,000 calls are made..."
  },

  "path": ["start", "scr_screening", "safety_assessment", ...],

  "nodeContent": { ... },

  "ending": {
    "title": "The System Stays",
    "description": "Maria's case is eventually closed...",
    "actions": [
      "Support The Bronx Defenders...",
      "Advocate for direct financial support to families in poverty"
    ]
  }
}
```

#### `nodeContent` — story text per node

Each key in `nodeContent` must match a node ID in `path[]`. The value is an object with a `blocks` array. Each block has a `type` that controls how it renders:

| type | Required fields | Optional fields | Renders as |
|------|----------------|-----------------|------------|
| `text` | `body` | `title` | Paragraph, bold heading if `title` present |
| `quote` | `text` | `attribution` | Italic blockquote with red left border |
| `callout` | `text` | — | Amber-bordered callout box |
| `image` | `src` | `caption`, `alt` | Full-width image with caption |

**Example:**

```json
"nodeContent": {
  "start": {
    "blocks": [
      {
        "type": "text",
        "title": "The Call",
        "body": "On a Tuesday afternoon in October, a neighbor called the SCR hotline..."
      },
      {
        "type": "callout",
        "text": "Anonymous callers face no legal consequences for false reports."
      },
      {
        "type": "quote",
        "text": "I kept asking: what exactly did they say I did?",
        "attribution": "Maria"
      }
    ]
  }
}
```

Nodes not present in `nodeContent` will still appear in the story — they'll show the system description from `nodes.json` instead of personal text.

---

### Editing Statistics — `src/data/config/statistics.json`

This file contains all 21 statistical visualizations as pure JSON. Each entry has:

```jsonc
{
  "stat-id": {
    "id": "stat-id",
    "nodeId": "which_node_this_belongs_to",
    "sources": [
      { "label": "NYC ACS Annual Report 2023" },
      { "label": "OCFS Data", "url": "https://..." }
    ],
    "chart": {
      "type": "big-number",
      // ... chart-specific fields
    }
  }
}
```

To change a number: find the stat by `id`, update the relevant field inside `chart`. See [Statistics Chart Types](#statistics-chart-types) for each type's field reference.

To change a citation: update the `sources` array. `url` is optional.

To reorder statistics within a node: reorder the `statisticIds` array in `nodes.json` for that node.

---

### Editing Nodes — `src/data/config/nodes.json`

This file controls the flowchart structure. There are two node types:

- **Primary nodes** — appear in both StoryPage and MapView; use in story `path[]`.
- **Hidden nodes** — MapView only; collapsed by default, expanded when user clicks the `+` badge on their parent primary node. Do not use in story `path[]`.

#### Node fields

```jsonc
{
  "nodes": {
    "node_id": {
      "id": "node_id",
      "x": 350,                         // canvas x position (0–6700)
      "y": 2000,                        // canvas y — primary: 600–3550; hidden: up to 5000
      "category": "hotline",            // controls border colour (see Node ID Reference)
      "icon": "ShieldAlert",            // must be in iconRegistry.ts (see Icon Registry)
      "iconColor": "text-yellow-500",   // any Tailwind text-color class
      "title": "Call to SCR Hotline",
      "description": "System-level explanation shown in both views.",
      "choices": [
        { "text": "Button label text", "nextNodeId": "next_node_id" }
      ],
      "statisticIds": ["stat-id-1", "stat-id-2"],

      // ── Hidden node fields (omit for primary nodes) ──────────────────────
      "nodeType": "hidden",             // "primary" (default) | "hidden"
      "parentPrimaryId": "cares_track"  // required when nodeType is "hidden"
    }
  },
  "edges": [
    { "from": "node_id", "to": "next_node_id" }
  ]
}
```

**Rules:**
- Every `nextNodeId` in `choices` must have a matching `{ "from": ..., "to": ... }` in `edges`
- `statisticIds` order controls the scroll order of stat phases in StoryPage
- Primary nodes: X spacing ~650 px per column; Y within 600–3550
- Hidden nodes: position near their parent; Y can reach 5000 (MapView uses a `5500 px` tall canvas)
- `nodeType` and `parentPrimaryId` can be omitted on primary nodes — they default to primary behaviour

---

## Statistics Chart Types

All 14 chart types are documented below. Find the relevant `"type"` value in `statistics.json` to understand which fields you can edit.

---

### `big-number`

A single oversized value, centered. Optional unit label, description paragraph, tag grid, and footer citation.

**Used by:** `determination-record`, `court-marianna`, `removal-marginal-cases`

```json
{
  "type": "big-number",
  "label": "How Long an \"Indicated\" Finding Stays on Your Record",
  "value": "28",
  "unit": "years",
  "accentColor": "red",
  "description": "An \"indicated\" finding — requiring only \"some credible evidence\" — can remain on the State Central Register for up to 28 years.",
  "tags": [
    "Employment checks",
    "Housing applications",
    "Future custody cases",
    "Professional licensing"
  ],
  "footer": "NY Social Services Law §422"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `value` | ✅ | Main display value (string — e.g. `"28"`, `"3×"`, `"$107,200"`) |
| `label` | ✅ | Section label shown in small caps above |
| `accentColor` | ✅ | Value colour — see [AccentColor Reference](#accentcolor-reference) |
| `unit` | — | Text below the value (e.g. `"years"`) |
| `description` | — | Paragraph below the unit |
| `tags` | — | Array of strings rendered as a 2-column grid of small cards |
| `footer` | — | Small italic citation at the bottom |

---

### `two-counter`

Two stacked numbers with a divider line. Primary is larger; secondary is smaller with muted text.

**Used by:** `start-scr-counter`

```json
{
  "type": "two-counter",
  "label": "New York City, 2023",
  "primary": {
    "value": "95,590",
    "description": "calls to the SCR hotline",
    "accentColor": "neutral"
  },
  "secondary": {
    "value": "22,120",
    "description": "ever substantiated",
    "qualifier": "(23.1%)",
    "accentColor": "neutral"
  },
  "note": "Over 73,000 families were investigated and found to have done nothing wrong."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `primary.value` | ✅ | Large number (top) |
| `primary.description` | ✅ | Label below the primary value |
| `primary.accentColor` | ✅ | Use `"neutral"` to render the primary value in white |
| `secondary.value` | ✅ | Smaller number (bottom) |
| `secondary.description` | ✅ | Label below the secondary value |
| `secondary.qualifier` | — | Appended to description in lighter grey |
| `note` | — | Italic note below a `border-t` divider |

> **Tip:** `accentColor: "neutral"` renders the primary value in **white** — correct for large headline numbers.

---

### `pipeline`

A horizontal funnel chart. Each stage is a bar whose width represents the percentage relative to the first stage (100%).

**Used by:** `start-pipeline`

```json
{
  "type": "pipeline",
  "label": "From Call to Removal — NYC, 2023",
  "stages": [
    { "label": "SCR Hotline Calls",    "pct": 100, "color": "neutral", "note": "95,590" },
    { "label": "Passed to Agencies",   "pct": 75,  "color": "neutral", "note": "75%"   },
    { "label": "Formal Investigation", "pct": 53,  "color": "amber",   "note": "~53%"  },
    { "label": "CARES Track",          "pct": 22,  "color": "amber",   "note": "22%"   },
    { "label": "Indicated",            "pct": 17,  "color": "red",     "note": "~17%"  },
    { "label": "Children Removed",     "pct": 8,   "color": "red",     "note": "~8%"   }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `stages[].label` | ✅ | Text label (shown inside bar if `pct ≥ 30`, otherwise after bar) |
| `stages[].pct` | ✅ | 0–100; first stage should be 100 (the reference width) |
| `stages[].color` | ✅ | AccentColor — controls bar fill colour |
| `stages[].note` | ✅ | Annotation shown to the left (count or percentage) |

---

### `bar-compare`

Vertical bars side by side. Each bar has a value label above and a name below.

**Used by:** `scr-acceptance-rate`

```json
{
  "type": "bar-compare",
  "label": "SCR Call Acceptance Rate",
  "bars": [
    { "value": "75%", "label": "New York",     "heightPct": 100, "accentColor": "red"     },
    { "value": "50%", "label": "National Avg.", "heightPct": 67,  "accentColor": "neutral" }
  ],
  "note": "New York passes 3 in 4 calls.\nMost states pass 1 in 2."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `bars[].value` | ✅ | Display string above the bar (e.g. `"75%"`) |
| `bars[].label` | ✅ | Name below the bar |
| `bars[].heightPct` | ✅ | 0–100; tallest bar = 100, others proportional |
| `bars[].accentColor` | ✅ | Bar fill and value text colour |
| `note` | — | Centered text below the chart; use `\n` for line breaks |

---

### `card-compare`

Two cards side by side. Has two variants controlled by `"variant"`.

**Used by:** `scr-anonymous-tips` (stat), `court-geography` (district)

#### Variant `"stat"` — two numbers

```json
{
  "type": "card-compare",
  "variant": "stat",
  "label": "Substantiation Rate Comparison",
  "left": {
    "header": "Anonymous Tips",
    "accentColor": "neutral",
    "preValue": "1 in 24 cases",
    "value": "6.7%",
    "postValue": "substantiated"
  },
  "right": {
    "header": "All Cases",
    "accentColor": "red",
    "preValue": "\u00a0",
    "value": "22.5%",
    "postValue": "substantiated"
  },
  "note": "Both families receive an investigator at the door."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `left/right.header` | ✅ | Card header label |
| `left/right.accentColor` | ✅ | Header background tint and value colour |
| `left/right.value` | ✅ | Large central number |
| `left/right.preValue` | — | Small text above the value |
| `left/right.postValue` | — | Small text below the value |
| `note` | — | Centered note below both cards |

#### Variant `"district"` — key-value table

```json
{
  "type": "card-compare",
  "variant": "district",
  "label": "FY 2023 — Geography of Intervention",
  "left": {
    "name": "Highbridge / Concourse",
    "subtitle": "South Bronx",
    "code": "District BX04",
    "accentColor": "red",
    "rows": [
      { "key": "SCR Intakes",       "value": "1,462" },
      { "key": "Article X Filings", "value": "149"   },
      { "key": "Median Income",     "value": "$28K"  }
    ]
  },
  "right": {
    "name": "Park Slope",
    "subtitle": "Brooklyn",
    "code": "District BK06",
    "accentColor": "neutral",
    "rows": [
      { "key": "SCR Intakes",       "value": "333"   },
      { "key": "Article X Filings", "value": "14"    },
      { "key": "Median Income",     "value": "$112K" }
    ]
  },
  "note": "Same system. Opposite outcomes."
}
```

---

### `horizontal-bars`

Horizontal progress bars stacked vertically. Each bar shows its label, percentage, and a filled track.

**Used by:** `investigation-race-rates`

```json
{
  "type": "horizontal-bars",
  "label": "% of Children Investigated by ACS, 2021",
  "bars": [
    { "label": "Black children",  "pct": 44, "accentColor": "red"     },
    { "label": "Latino children", "pct": 43, "accentColor": "amber"   },
    { "label": "White children",  "pct": 19, "accentColor": "neutral" }
  ],
  "callout": "A Black child in NYC has nearly a **50% chance** of being investigated by age 18."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `bars[].label` | ✅ | Row label (left) |
| `bars[].pct` | ✅ | 0–100; controls bar fill width |
| `bars[].accentColor` | ✅ | Bar fill and percentage value colour |
| `callout` | — | Bold callout below the bars. Wrapping text in `**double asterisks**` renders it in red-400. |

---

### `stacked-bars`

Each row has two segments side by side: a highlighted left segment and a neutral right segment.

**Used by:** `determination-dragnet`

```json
{
  "type": "stacked-bars",
  "label": "FY 2023 — What Follows a Report",
  "leftLabel": "indicated",
  "rightLabel": "unsubstantiated",
  "rows": [
    { "label": "Black & Latino families", "leftPct": 18 },
    { "label": "White families",          "leftPct": 24 },
    { "label": "All families",            "leftPct": 23 }
  ],
  "note": "In FY 2023, 56.6% of all intakes were unsubstantiated."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `leftLabel` | ✅ | Label for the red left segment (shown inside each bar) |
| `rightLabel` | ✅ | Label for the grey right segment (shown inside each bar) |
| `rows[].label` | ✅ | Row category label above the bar |
| `rows[].leftPct` | ✅ | 0–100; left segment width; right = `100 - leftPct` |
| `note` | — | Italic footnote below all rows |

---

### `quote-list`

Stacked blockquotes with a red left border.

**Used by:** `safety-investigator-quotes`

```json
{
  "type": "quote-list",
  "label": "Documented Investigator Tactics — Bronx Families",
  "quotes": [
    { "text": "\"I'm not going to stop coming.\"" },
    { "text": "\"Why not, if you don't have anything to hide?\"" },
    { "text": "\"We can do this the easy way or I can get a warrant.\"", "attribution": "ACS investigator" }
  ],
  "note": "Documented tactics reported by ACS-investigated families in the Bronx."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `quotes[].text` | ✅ | The quote text (include quotation marks manually) |
| `quotes[].attribution` | — | Shown as `— Attribution` below the quote |
| `note` | — | Small italic footnote below all quotes |

---

### `highlight-callout`

A large value in an accented bordered box, followed by a bullet list.

**Used by:** `case-plan-coercion`

```json
{
  "type": "highlight-callout",
  "label": "The Reality of \"Voluntary\" Service Plans",
  "highlight": {
    "value": "9 in 10",
    "description": "families report experiencing ACS \"voluntary\" agreements as coercive",
    "accentColor": "amber"
  },
  "bullets": [
    "Refusing services = evidence of non-cooperation",
    "Non-cooperation = basis for court petition",
    "Compliance extends monitoring, not ends it"
  ],
  "note": "\"Voluntary\" is a legal term, not an accurate description of how families experience these agreements. — Dettlaff et al., Child Welfare, 2020"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `highlight.value` | ✅ | Large value inside the box |
| `highlight.description` | ✅ | Description text inside the box |
| `highlight.accentColor` | ✅ | Box border, background, and text colour |
| `bullets` | ✅ | Array of bullet point strings |
| `note` | — | Small italic footnote below the bullets |

---

### `grid-cards`

A grid of small stat cards. Each card has a value and description. Optional info box below.

**Used by:** `supervision-renewal`, `kinship-support-gap`, `group-home-outcomes`

```json
{
  "type": "grid-cards",
  "label": "After the Supervision Order",
  "columns": 2,
  "cardStyle": "colored",
  "cards": [
    { "value": "1 in 3",  "description": "supervision orders are renewed at least once", "accentColor": "red"   },
    { "value": "monthly", "description": "ACS home visits required under supervision",   "accentColor": "amber" }
  ],
  "infoBox": {
    "title": "Any of the following can trigger escalation:",
    "bullets": [
      "A new concern reported to the hotline",
      "Missed service appointment",
      "Housing or employment instability",
      "Caseworker's subjective assessment"
    ]
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `columns` | ✅ | `1`, `2`, or `3` — grid column count |
| `cardStyle` | — | `"colored"` = accent-tinted card background and border; `"dark"` (default) = neutral card with accent value text |
| `cards[].value` | ✅ | Stat value displayed large |
| `cards[].description` | ✅ | Supporting label below the value |
| `cards[].accentColor` | ✅ | Value text colour (and background tint if `cardStyle: "colored"`) |
| `infoBox.title` | — | Bold title for an optional info box below the grid |
| `infoBox.bullets` | — | Bullet list items in the info box |

---

### `cost-compare`

Two cost items separated by a `vs.` divider.

**Used by:** `removal-cost`

```json
{
  "type": "cost-compare",
  "label": "Annual Cost Comparison",
  "items": [
    {
      "description": "To separate a child from their family",
      "value": "$107,200",
      "note": "per child · per year · 2024",
      "accentColor": "red"
    },
    {
      "description": "To keep Eline's family together",
      "value": "$3,600",
      "note": "per year ($300/month housing subsidy)",
      "accentColor": "neutral"
    }
  ],
  "conclusion": "The system chose separation."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `items[].description` | ✅ | Caption above the value |
| `items[].value` | ✅ | Cost value (large display) |
| `items[].accentColor` | ✅ | Value colour |
| `items[].note` | — | Small note below the value |
| `conclusion` | — | Centered text below the `vs.` divider |

---

### `timeline-bar`

A large headline number followed by proportional horizontal segment bars.

**Used by:** `court-duration`

```json
{
  "type": "timeline-bar",
  "label": "How Long a Family Court Case Takes",
  "headline": {
    "value": "18",
    "unit": "months average",
    "accentColor": "red"
  },
  "segments": [
    { "label": "Initial hearing",      "widthPct": 8,  "accentColor": "neutral" },
    { "label": "Investigation period", "widthPct": 15, "accentColor": "amber"   },
    { "label": "Service compliance",   "widthPct": 30, "accentColor": "orange"  },
    { "label": "Follow-up hearings",   "widthPct": 47, "accentColor": "red"     }
  ],
  "note": "Each hearing lasts ~30 minutes. The case lasts months to years."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `headline.value` | ✅ | Large number |
| `headline.unit` | ✅ | Text below the number |
| `headline.accentColor` | ✅ | Headline number colour |
| `segments[].label` | ✅ | Phase label shown to the left of the bar |
| `segments[].widthPct` | ✅ | 0–100; all segments should sum to ~100 |
| `segments[].accentColor` | ✅ | Bar fill colour |
| `note` | — | Small italic footnote below all segments |

---

### `line-chart`

An SVG area/line chart. Accepts actual data values (years and counts/percentages) — the renderer normalizes them automatically to SVG coordinates.

**Used by:** `scr-case-volume`, `cares-trend`

```json
{
  "type": "line-chart",
  "label": "ACS Case Volume, 2004–2023",
  "xAxis": { "type": "year", "min": 2004, "max": 2023 },
  "yAxis": { "min": 0, "max": 110000, "format": "number" },
  "series": [
    {
      "id": "acs-cases",
      "label": "ACS Cases",
      "accentColor": "red",
      "dashed": false,
      "areaFill": true,
      "points": [
        { "x": 2004, "y": 72000 },
        { "x": 2015, "y": 108000 },
        { "x": 2023, "y": 54000 }
      ]
    }
  ],
  "annotations": [
    { "x": 2020, "spanYears": 1, "label": "COVID" }
  ],
  "note": "Cases fell when children were home and out of sight of mandated reporters.",
  "callout": {
    "text": "Reform in name. The pipeline remains.",
    "subtext": "\"CARES may function as another surveillance program.\" — The Bronx Defenders"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `xAxis.min` / `xAxis.max` | ✅ | Actual x-axis domain (e.g. `2004`, `2023`) |
| `xAxis.type` | ✅ | `"year"` or `"number"` — affects label display |
| `yAxis.min` / `yAxis.max` | ✅ | Actual y-axis domain (e.g. `0`, `110000`) |
| `yAxis.format` | ✅ | `"number"` (uses `toLocaleString`) or `"percent"` (appends `%`) |
| `series[].id` | ✅ | Unique series identifier |
| `series[].label` | ✅ | Legend label (shown when 2+ series) |
| `series[].accentColor` | ✅ | Line and area fill colour |
| `series[].dashed` | ✅ | `true` = dashed stroke |
| `series[].areaFill` | ✅ | `true` = gradient fill below the line |
| `series[].points` | ✅ | Array of `{ "x": actual_value, "y": actual_value }` |
| `annotations[]` | — | Vertical highlight bands (e.g. COVID period) |
| `annotations[].x` | — | Start x-value of the band |
| `annotations[].spanYears` | — | Width of the band in x-axis units |
| `annotations[].label` | — | Label above the band |
| `note` | — | Italic note below the chart |
| `callout.text` | — | Bold tagline below the chart |
| `callout.subtext` | — | Quoted note below the tagline (with top border) |

> **Auto-endpoint label:** For single-series charts, the renderer automatically annotates the last data point with its formatted Y value (e.g. `"22%"`). This requires no configuration.

---

### `component` (Escape Hatch)

Renders a fully custom React component. Use this when the visual is too bespoke for any declarative chart type.

**Used by:** `safety-warrant-rate` (WarrantBox), `group-home-placement-instability` (PlacementInstability)

```json
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

| Field | Required | Description |
|-------|----------|-------------|
| `componentId` | ✅ | Must match a key in `src/components/charts/customRegistry.ts` |
| `data` | ✅ | Props passed to the component as `{ data }`. Each component defines its own data schema. |

---

## Developer Guides

### Add a New Statistic

**Case A — use an existing chart type:**

1. Open `src/data/config/statistics.json`.
2. Add a new entry with a unique `id`:
   ```json
   "new-stat-id": {
     "id": "new-stat-id",
     "nodeId": "target_node",
     "sources": [{ "label": "Your source here" }],
     "chart": { "type": "big-number", ... }
   }
   ```
3. Open `src/data/config/nodes.json` and add `"new-stat-id"` to the `statisticIds` array of the target node.

**Case B — need a custom component (escape hatch):**

1. Create `src/components/charts/custom/YourChart.tsx`. The component must accept `{ data: Record<string, unknown> }`:
   ```tsx
   interface YourChartData { value?: string; /* ... */ }
   export default function YourChart({ data }: { data: Record<string, unknown> }) {
     const d = data as YourChartData;
     return <div>{ d.value }</div>;
   }
   ```
2. Register it in `src/components/charts/customRegistry.ts`:
   ```ts
   import YourChart from './custom/YourChart';
   export const CUSTOM_CHART_REGISTRY = { ..., YourChart };
   ```
3. Add the entry to `statistics.json` with `"type": "component"` and `"componentId": "YourChart"`.
4. Add the ID to the relevant node's `statisticIds` in `nodes.json`.

---

### Add a New Story Character

1. Copy `src/data/stories/maria.json` to `src/data/stories/[name].json`.
2. Change `"id"`, `"character"`, `"intro"`, `"ending"`.
3. Set `"path"` to an ordered list of node IDs (see [Node ID Reference](#node-id-reference)).
4. Add a `"nodeContent"` entry for each node in the path.
5. In `src/App.tsx`, import the new JSON and pass it to `<StoryPage>`:
   ```tsx
   import type { StoryConfig } from './types';
   import joseJson from './data/stories/jose.json';
   const JOSE_STORY = joseJson as StoryConfig;
   // then: <StoryPage storyConfig={JOSE_STORY} ... />
   ```

---

### Add or Edit a Flowchart Node

**Edit** — open `src/data/config/nodes.json`, find the node by key, change any field. Changing `x`/`y` repositions it on the canvas.

**Add a new primary node:**

1. Add the node entry to `"nodes"` in `nodes.json` (omit `nodeType` — it defaults to primary).
2. Set `x`/`y` within the primary canvas zones (see layout reference below).
3. Add edges to `"edges"` connecting it to adjacent nodes.
4. Add `choices` entries in existing nodes that should link to it.
5. If needed, add statistics in `statistics.json` and reference them in `statisticIds`.

**Add hidden sub-nodes to an existing primary node:**

Hidden nodes expand the detail visible in MapView when the user clicks the `+` badge on a primary node. They are invisible in StoryPage.

1. Add entries to `"nodes"` with `"nodeType": "hidden"` and `"parentPrimaryId": "<target-primary-id>"`.
2. Position them in the hidden node zones (see layout reference below); do not overlap primary nodes.
3. Add edges in `"edges"` connecting hidden nodes to each other. Include at least one edge from the primary node to a hidden node so MapView knows where to start.
4. Do **not** add hidden nodes to any story `path[]` — they are MapView-only.
5. StoryPage automatically filters them out; no StoryPage changes needed.

**Remove a node:**

1. Delete the entry from `"nodes"`.
2. Remove all edges where `"from"` or `"to"` equals the deleted ID.
3. Remove any `choices` referencing the deleted ID in other nodes.
4. Remove it from `"path"` in any story JSON files.

**Canvas layout reference:**

Primary nodes (StoryPage uses `6700 × 4500`; MapView uses `6700 × 5500`):

```
y ≈ 600–900    Better-outcome exits (screened_out, cares_track, unsubstantiated)
y ≈ 1100       Supervision endpoint
y ≈ 2000       Main horizontal spine (hotline → court)
y ≈ 2950–3550  Removal branches (foster care, kinship, group home)
X spacing: ~650 px per depth column
```

Hidden node zones (MapView only):

```
y ≈ 1350       CARES sub-tree  (parent: cares_track)
y ≈ 1500–2300  Supervision sub-tree  (parent: supervision_order)
y ≈ 2450       Fork node  (parent: scr_screening)
y ≈ 3400–5000  Foster care placement tree  (parent: foster_care_removal)
```

Set `"nodeType": "hidden"` and `"parentPrimaryId": "<primary-id>"` on any node that should only appear in MapView when expanded. Do not add hidden nodes to story `path[]` arrays.

---

### Add a New Chart Type (Escape Hatch)

If you need a chart type beyond the 14 built-in ones and a custom component isn't enough (e.g. you want it to be reusable), add it to the declarative schema:

1. Add the interface to `src/types.ts` and add it to the `StatChartConfig` union.
2. Create `src/components/charts/YourRenderer.tsx`.
3. Import and add a `case 'your-type':` to `src/components/charts/StatRenderer.tsx`.

---

### Add a New Icon

1. Find the icon name on [lucide.dev](https://lucide.dev).
2. Open `src/config/iconRegistry.ts`.
3. Add the import and add it to `ICON_REGISTRY`:
   ```ts
   import { ..., YourIcon } from 'lucide-react';
   export const ICON_REGISTRY = { ..., YourIcon };
   ```
4. In `nodes.json`, set `"icon": "YourIcon"` on the relevant node.

---

### Tune the Scroll Experience

All scroll pacing, camera zoom levels, overlay opacity, and layout geometry are controlled by `SCROLL_CONFIG` at the top of `src/components/StoryPage.tsx`.

```ts
const SCROLL_CONFIG = {
  phaseHeights: {
    hero:     1.5,   // × viewport height — larger = slower scroll feel
    overview: 1.0,
    focus:    1.0,
    story:    1.2,
    stat:     1.0,
    ending:   1.2,
  },
  cam: {
    overviewFit: 0.88,  // fraction of viewport filled in overview zoom
    focusScale:  0.48,  // canvas scale when zoomed to a node
    storyScale:  0.60,  // canvas scale when story card is visible
  },
  overlay: {
    hero:       0.92,   // dark overlay opacity (0 = transparent, 1 = black)
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
    cardFraction:      0.46,  // story card width as fraction of viewport
    cardStatLeftFrac:  0.03,  // card left edge when stat panel is visible
    statPanelLeftFrac: 0.50,  // stat panel left edge
  },
  statAnim: {
    enterZone:     0.25,  // first 25% of stat phase = entrance (slide up + fade in)
    exitZone:      0.75,  // last 25% of stat phase = exit (slide further up + fade out)
    enterOffsetPx: 64,    // starting translateY offset (px below resting)
    exitOffsetPx:  32,    // ending translateY offset (px above resting)
  },
}
```

---

## Reference Tables

### Icon Registry

All valid values for the `"icon"` field in `nodes.json`:

| `"icon"` value | Visual | Notable uses |
|----------------|--------|-------------|
| `"ShieldAlert"` | Shield with exclamation | `start` |
| `"Search"` | Magnifying glass | `scr_screening` |
| `"XCircle"` | Circle with X | `screened_out` |
| `"Shield"` | Plain shield | `safety_assessment` |
| `"Handshake"` | Handshake | `cares_track`, `community_services`, `mandated_preventive` |
| `"EyeOff"` | Eye with slash | `investigation` |
| `"Scale"` | Justice scales | `determination`, `court_hearing` |
| `"CheckCircle2"` | Circle with checkmark | `unsubstantiated`, `cares_success`, `supervision_success` |
| `"ClipboardList"` | Clipboard with lines | `case_plan`, `family_led_assessment` |
| `"FileCheck"` | File with checkmark | `court_filing`, `service_plan_cares`, `court_service_plan` |
| `"Home"` | House | `supervision_order`, `family_setting_decision`, `traditional_foster_care_node` |
| `"AlertTriangle"` | Triangle with exclamation | `foster_care_removal`, `traditional_investigation_loop`, `supervision_failure` |
| `"Heart"` | Heart | `kinship_placement`, `placement_decision`, `kinship_foster_care` |
| `"Building2"` | Building | `group_home`, `residential_placement` |
| `"Users"` | Two people | `fork`, `cares_entry`, `cares_main`, `supervision_intake` |
| `"Stethoscope"` | Stethoscope | `medical_needs_decision`, `specialized_foster_care` |
| `"Brain"` | Brain | `trauma_decision`, `effc` |

To add more icons, see [Add a New Icon](#add-a-new-icon).

---

### AccentColor Reference

All valid values for any `accentColor` field:

| Value | Text class | BG class | Typical use |
|-------|-----------|----------|-------------|
| `"red"` | `text-red-400` | `bg-red-500` | Main alert, data highlights, removal |
| `"amber"` | `text-amber-400` | `bg-amber-500` | Secondary alert, CARES track |
| `"orange"` | `text-orange-400` | `bg-orange-500` | Mid-process, service compliance |
| `"green"` | `text-green-400` | `bg-green-500` | Positive outcomes (rare) |
| `"blue"` | `text-blue-400` | `bg-blue-500` | Neutral information |
| `"pink"` | `text-pink-400` | `bg-pink-500` | Kinship / family care |
| `"neutral"` | `text-neutral-400` | `bg-neutral-500` | Secondary data, control group |

> **Special case:** In `two-counter`, setting `primary.accentColor: "neutral"` renders the primary value in **white** (`text-white`), not grey. Use this for large headline numbers.

---

### Node ID Reference

**Primary nodes** — valid in `"path"`, `"nextNodeId"`, and `"statisticIds"`:

| Node ID | Title | Category |
|---------|-------|----------|
| `start` | Call to SCR Hotline | `hotline` |
| `scr_screening` | SCR Screening | `hotline` |
| `screened_out` | Call Screened Out | `neutral` |
| `safety_assessment` | Safety Assessment | `neutral` |
| `cares_track` | CARES — Supportive Track | `cares` |
| `investigation` | ACS Investigation | `investigation` |
| `determination` | Investigation Finding | `investigation` |
| `unsubstantiated` | Case Closed — Unfounded | `neutral` |
| `case_plan` | Voluntary Service Agreement | `investigation` |
| `court_filing` | ACS Files a Court Petition | `court` |
| `court_hearing` | Family Court Hearing | `court` |
| `supervision_order` | Court Supervision Order | `court` |
| `foster_care_removal` | Child Removed — Placed in ACS Custody | `court` |
| `kinship_placement` | Kinship Placement | `court` |
| `group_home` | Foster Care or Group Home Placement | `court` |

**Hidden nodes** — MapView only; do not use in story `path[]`:

| Node ID | Parent primary | Sub-tree |
|---------|---------------|----------|
| `fork` | `scr_screening` | ACS intake step |
| `cares_entry`, `cares_main`, `family_led_assessment`, `service_plan_cares`, `cares_success`, `traditional_investigation_loop` | `cares_track` | CARES detail flow |
| `community_services` | `unsubstantiated` | Post-closure services |
| `supervision_intake`, `court_service_plan`, `supervision_success`, `supervision_failure`, `mandated_preventive` | `supervision_order` | Supervision compliance flow |
| `placement_decision`, `kinship_foster_care`, `medical_needs_decision`, `specialized_foster_care`, `trauma_decision`, `effc`, `family_setting_decision`, `traditional_foster_care_node`, `residential_placement` | `foster_care_removal` | Foster care placement tree |

---

## Types Reference

All interfaces live in `src/types.ts`. Key types:

```ts
// Flowchart
type NodeCategory = 'hotline' | 'cares' | 'warning' | 'investigation' | 'court' | 'neutral'
interface StoryNode      // runtime node (icon resolved to ReactElement)
interface NodeConfigEntry // JSON-serializable node (icon as string)
interface NodesFile      // { nodes: Record<string, NodeConfigEntry>, edges: Edge[] }
interface Edge           // { from: string; to: string }

// Statistics
type AccentColor = 'red' | 'amber' | 'orange' | 'green' | 'blue' | 'pink' | 'neutral'
interface StatEntry      // one entry in statistics.json: { id, nodeId, sources, chart }
type StatisticsConfig    // Record<string, StatEntry>
type StatChartConfig     // union of all 14 chart type interfaces
interface NodeStatistic  // runtime stat: { id, component: ReactElement, sources }

// Story
interface StoryConfig    // one character's full narrative (path + nodeContent + ending)
type StoryContentBlock   // text | quote | callout | image
```

---

## Roadmap

- **Headless CMS** — Move `nodes.json`, `statistics.json`, and story JSON to Sanity / Contentful so researchers can update copy through a web interface without touching files.
- **Analytics** — PostHog / Mixpanel event tracking on node selection, path completion, and expand events.
- **Shareable URLs** — Encode visited `path` as a query parameter for path replay and sharing.
- **Accessibility** — `aria-label`, keyboard navigation (arrow keys on graph), focus management for stat panels.
- **Touch pinch-zoom** — Two-finger pinch zoom for the MapView overview on mobile.
- **Additional stories** — New character JSON files (José, Eline) following the same `StoryConfig` schema.
