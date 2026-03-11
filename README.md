# From Child Welfare to Family Policing

An interactive web application built in partnership with **The Bronx Defenders**. It transforms complex research on the "Family Policing" system into a navigable spatial map, educating the public and policymakers on how the current system disproportionately targets marginalized communities and routinely confuses poverty with neglect.

---

## Quick Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18 (functional components + hooks) | — |
| Language | TypeScript 5 | Strict mode enabled |
| Build tool | Vite 5 | Fast HMR, ESM-native |
| Styling | Tailwind CSS 3 | Utility-first; config in `tailwind.config.js` |
| Icons | lucide-react | SVG icon components |

No routing library is used. The entire app is a single-page application with two top-level views managed by `useState` in `App.tsx`.

---

## Project Structure

```
src/
├── main.tsx                  # React root, mounts <App />
├── index.css                 # Tailwind directives (@base, @components, @utilities)
├── App.tsx                   # Top-level view router ('landing' | 'map')
├── types.ts                  # All shared TypeScript interfaces and types
│
├── data/
│   └── storyNodes.tsx        # STORY_NODES (default export) + EDGES (named export)
│
└── components/
    ├── LandingPage.tsx        # Landing page with statistics and CTA
    ├── MapView.tsx            # Interactive spatial map — the core experience
    └── FactModal.tsx          # "System Reality" full-screen modal overlay
```

---

## Architecture

### Views

The app has two views, toggled by `currentView` state in `App.tsx`:

```
'landing'  →  LandingPage
'map'      →  MapView
```

`LandingPage` accepts an `onStart` callback. `MapView` accepts an `onBackToLanding` callback. All other state lives inside the components themselves.

### MapView — State & Logic

`MapView` manages its own internal state:

| State variable | Type | Purpose |
|----------------|------|---------|
| `activeNodeId` | `string \| null` | `null` = full overview; set = zoomed into a node |
| `history` | `string[]` | Ordered list of previously visited node IDs |
| `showFactModal` | `boolean` | Controls the `FactModal` overlay |
| `showHistoryDropdown` | `boolean` | Controls the history dropdown in the nav bar |
| `viewport` | `{ w, h }` | Window dimensions, updated on `resize` |

**Camera Engine** (`useMemo → cameraTransform`):
- **Overview mode** (`activeNodeId === null`): scales the entire canvas to fit the viewport at 90%, centered.
- **Focused mode** (`activeNodeId` is set): translates the canvas so the selected node's `(x, y)` is centered on screen. Scale is `1` on desktop, `0.7` on mobile.
- Animated via CSS `transition-transform duration-1000 cubic-bezier(0.25,1,0.5,1)`.

**Incoming Nodes** (`useMemo → incomingNodes`):
- Derived by filtering `EDGES` where `edge.to === activeNodeId`.
- Rendered in the **Left Wing** of the detail overlay, allowing reverse traversal.

---

## Core Data: `src/data/storyNodes.tsx`

This is the single source of truth for all content. To add, remove, or edit the narrative, only this file needs to change.

### `STORY_NODES` (default export)

A `Record<string, StoryNode>` object. Each key is a unique node ID.

**`StoryNode` schema** (see `src/types.ts`):

```ts
interface StoryNode {
  id: string;           // Must match the object key
  title: string;        // Headline shown in the center card
  description: string;  // Narrative paragraph shown in the center card
  icon: ReactElement;   // lucide-react icon component (sized w-8 md:w-12)
  x: number;            // Canvas x-coordinate (node center)
  y: number;            // Canvas y-coordinate (node center)
  category: NodeCategory; // Controls border colour on the map node card
  fact?: {              // Optional "System Reality" pop-up
    title: string;
    content: string;
  };
  choices: Choice[];    // Forward edges; empty array = terminal node
}
```

**`NodeCategory`** and their map border colours:

| Category | Border colour | Used for |
|----------|--------------|---------|
| `hotline` | yellow-400 | Initial call and SCR screening |
| `cares` | green-400 | CARES / FAR track |
| `warning` | amber-400 | System trap / loop-back nodes |
| `investigation` | red-400 | ACS investigation track |
| `court` | red-700 | FCA Article 10 and all post-court nodes |
| `neutral` | neutral-300 | Dead ends, case closed, community services |

**Terminal nodes** (`choices: []`) display an "End of Path — Return to Map" button in the right wing instead of forward choices.

### `EDGES` (named export)

```ts
export const EDGES: Edge[] = [
  { from: 'start', to: 'scr_screening' },
  // ...32 directed edges total
];
```

`EDGES` is consumed by `MapView` for two purposes:
1. **SVG bezier curves** drawn between node positions on the canvas.
2. **Incoming node lookup** (reverse traversal shown in the left wing).

> **Important:** `EDGES` must stay in sync with the `choices` arrays in `STORY_NODES`. Every `nextNodeId` in a `choices` entry should have a corresponding `EDGES` entry.

### Canvas Layout

The canvas is `6700 × 4500` px. Nodes are laid out on a conceptual grid:

```
y ≈ 400   Screened Out (dead end)
y ≈ 750   CARES track (green)
y ≈ 1200  Main entry spine: start → scr_screening → fork → safety_assessment
y ≈ 1700  Traditional investigation
y ≈ 1400  Unfounded outcome (case closed, community services)
y ≈ 2150  FCA Article 10 (family court)
y ≈ 1950  Supervision sub-track
y ≈ 2600  Foster care / child removal sub-track
y ≈ 3050+ Placement decision tree (kinship → medical → trauma → family setting)
```

X spacing is approximately 450 px per depth column; node cards are 320 px wide, giving ~130 px horizontal clearance between same-row nodes.

---

## Adding or Editing Content

### Edit an existing node

Open `src/data/storyNodes.tsx` and find the node by its key. You can change `title`, `description`, `fact`, or `choices` freely. Changing `x`/`y` will reposition the node on the canvas.

### Add a new node

1. Add a new entry to `STORY_NODES` with a unique key and all required fields.
2. Assign `x`/`y` coordinates that fit the existing layout (use the grid above as a guide).
3. Add one or more entries to `EDGES` pointing to/from the new node.
4. Link existing nodes to the new one by adding a `choices` entry in their definition.

### Remove a node

1. Delete the entry from `STORY_NODES`.
2. Remove all `EDGES` entries where `from` or `to` is the deleted node ID.
3. Remove any `choices` entries in other nodes that reference the deleted ID.

---

## UI Components

### `LandingPage`

Props: `onStart: () => void`

Static page. Three statistic cards + CTA button. No internal state.

### `MapView`

Props: `onBackToLanding: () => void`

Manages all interactive map logic. Renders:
- A full-canvas `<div>` with an SVG edge layer and absolutely-positioned node cards.
- A fixed top navigation bar (title, history dropdown, "Full Map", "Home").
- A full-screen overlay with the three-panel detail layout when a node is active.
- The `FactModal` when `showFactModal` is true.

### `FactModal`

Props: `fact: Fact`, `onClose: () => void`

Stateless. Renders a centred modal card. Can be dismissed by clicking the backdrop, the × button, or the "Understood" button.

---

## Roadmap

The following improvements are identified for future phases:

- **Headless CMS integration** — Move `STORY_NODES` content to Sanity or Contentful so researchers and designers can update narrative copy without touching code. The TypeScript schema in `types.ts` can serve as the CMS content model.

- **Analytics** — Add event tracking (e.g. PostHog, Mixpanel) on `handleNodeSelect` in `MapView` to capture which nodes users visit, which paths they follow, and where they drop off.

- **Path replay / shareable URLs** — Encode the `history` array as a URL query parameter so users can share or revisit a specific path through the system.

- **Animations** — Integrate `framer-motion` for node card entrance animations and smoother overlay transitions.

- **State management** — If user tracking, saved progress, or cross-component data sharing grows complex, consider Zustand as a lightweight store before reaching for Redux.

- **Accessibility** — Add `aria-label`, keyboard navigation support (arrow keys to traverse the graph), and focus management when the detail overlay opens and closes.

- **Mobile map interaction** — The current camera uses CSS `transform` only. Adding touch-drag pan support for the overview map would significantly improve the mobile experience.
