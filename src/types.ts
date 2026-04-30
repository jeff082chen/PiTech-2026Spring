import type { ReactElement } from 'react';

export type NodeCategory = 'hotline' | 'cares' | 'warning' | 'investigation' | 'court' | 'neutral';

export interface Choice {
  text: string;
  nextNodeId: string;
}

// ─── Source citation ──────────────────────────────────────────────────────────

export interface Source {
  label: string;
  url?: string;
}

// ─── Node statistic: a rich visual component + citations ─────────────────────

export interface NodeStatistic {
  id: string;
  component: ReactElement;
  sources: Source[];
}

// ─── System graph node ────────────────────────────────────────────────────────

export interface StoryNode {
  id: string;
  title: string;
  description: string;          // institutional explanation (system-level)
  icon: ReactElement;
  x: number;
  y: number;
  category: NodeCategory;
  statistics?: NodeStatistic[]; // zero to many visual stat components
  choices: Choice[];
  nodeType?: 'primary' | 'hidden'; // hidden nodes only appear in MapView when expanded
  parentPrimaryId?: string;        // required when nodeType === 'hidden'
}

export interface Edge {
  from: string;
  to: string;
}

export type StoryNodes = Record<string, StoryNode>;

// ─── Node config (JSON-serializable, lives in data/config/nodes.json) ─────────
// icon is a string key into ICON_REGISTRY; iconColor is a Tailwind text class.
// statistics are wired up at runtime via statisticIds → StatisticsConfig.

export interface NodeConfigEntry {
  id: string;
  x: number;
  y: number;
  category: NodeCategory;
  icon: string;               // key in ICON_REGISTRY, e.g. "ShieldAlert"
  iconColor?: string;         // Tailwind text class, e.g. "text-yellow-500"
  title: string;
  description: string;
  choices: Choice[];
  statisticIds?: string[];    // ordered refs into statistics.json
  nodeType?: 'primary' | 'hidden'; // hidden nodes only appear in MapView when expanded
  parentPrimaryId?: string;        // required when nodeType === 'hidden'
}

export interface NodesFile {
  nodes: Record<string, NodeConfigEntry>;
  edges: Edge[];
}

// ─── Accent colour token ─────────────────────────────────────────────────────
// Used by all chart renderers. Maps to Tailwind classes via accentMap.ts.

export type AccentColor = 'red' | 'amber' | 'orange' | 'green' | 'blue' | 'pink' | 'neutral';

// ─── Stat entry (one scroll phase) ───────────────────────────────────────────

export interface StatEntry {
  id:      string;
  nodeId:  string;
  sources: Source[];
  chart:   StatChartConfig;
}

export type StatisticsConfig = Record<string, StatEntry>;

// ─── Chart type union ─────────────────────────────────────────────────────────

export type StatChartConfig =
  | BigNumberChart
  | TwoCounterChart
  | PipelineChart
  | BarCompareChart
  | CardCompareChart
  | HorizontalBarsChart
  | StackedBarsChart
  | QuoteListChart
  | HighlightCalloutChart
  | GridCardsChart
  | CostCompareChart
  | TimelineBarChart
  | LineChartConfig
  | ComponentChart;

// ── big-number ────────────────────────────────────────────────────────────────

export interface BigNumberChart {
  type: 'big-number';
  label: string;
  value: string;
  unit?: string;
  accentColor: AccentColor;
  description?: string;
  tags?: string[];
  footer?: string;
}

// ── two-counter ───────────────────────────────────────────────────────────────

export interface CounterItem {
  value: string;
  description: string;
  qualifier?: string;
  accentColor: AccentColor;
}

export interface TwoCounterChart {
  type: 'two-counter';
  label: string;
  primary: CounterItem;
  secondary: CounterItem;
  note?: string;
}

// ── pipeline ──────────────────────────────────────────────────────────────────

export interface PipelineStage {
  label: string;
  pct:   number;   // 0–100; controls bar width relative to container
  note:  string;   // left-aligned annotation (count or %)
  color: AccentColor;
}

export interface PipelineChart {
  type: 'pipeline';
  label: string;
  stages: PipelineStage[];
}

// ── bar-compare ───────────────────────────────────────────────────────────────

export interface BarCompareItem {
  value:       string;
  label:       string;
  heightPct:   number;   // 0–100; tallest bar = 100
  accentColor: AccentColor;
}

export interface BarCompareChart {
  type: 'bar-compare';
  label: string;
  bars: BarCompareItem[];
  note?: string;
}

// ── card-compare ──────────────────────────────────────────────────────────────

export interface StatCardData {
  header:      string;
  accentColor: AccentColor;
  preValue?:   string;
  value:       string;
  postValue?:  string;
}

export interface DistrictCardData {
  name:        string;
  subtitle:    string;
  code:        string;
  accentColor: AccentColor;
  rows:        { key: string; value: string }[];
}

export type CardCompareChart =
  | { type: 'card-compare'; variant: 'stat';     label: string; left: StatCardData;     right: StatCardData;     note?: string }
  | { type: 'card-compare'; variant: 'district'; label: string; left: DistrictCardData; right: DistrictCardData; note?: string };

// ── horizontal-bars ───────────────────────────────────────────────────────────

export interface HorizontalBar {
  label:       string;
  pct:         number;   // 0–100; controls fill width
  accentColor: AccentColor;
}

export interface HorizontalBarsChart {
  type: 'horizontal-bars';
  label: string;
  bars: HorizontalBar[];
  callout?: string;   // supports **bold** syntax
}

// ── stacked-bars ──────────────────────────────────────────────────────────────

export interface StackedBarRow {
  label:   string;
  leftPct: number;   // left (highlighted) segment; right = 100 − leftPct
}

export interface StackedBarsChart {
  type: 'stacked-bars';
  label:      string;
  leftLabel:  string;
  rightLabel: string;
  rows:       StackedBarRow[];
  note?:      string;
}

// ── quote-list ────────────────────────────────────────────────────────────────

export interface QuoteItem {
  text:          string;
  attribution?:  string;
}

export interface QuoteListChart {
  type: 'quote-list';
  label:   string;
  quotes:  QuoteItem[];
  note?:   string;
}

// ── highlight-callout ─────────────────────────────────────────────────────────

export interface HighlightCalloutChart {
  type: 'highlight-callout';
  label: string;
  highlight: {
    value:       string;
    description: string;
    accentColor: AccentColor;
  };
  bullets: string[];
  note?:   string;
}

// ── grid-cards ────────────────────────────────────────────────────────────────

export interface GridCard {
  value:       string;
  description: string;
  accentColor: AccentColor;
}

export interface InfoBox {
  title:   string;
  bullets: string[];
}

export interface GridCardsChart {
  type: 'grid-cards';
  label:      string;
  columns:    1 | 2 | 3;
  cardStyle?: 'dark' | 'colored';   // dark = neutral bg (default), colored = accent bg
  cards:      GridCard[];
  infoBox?:   InfoBox;
}

// ── cost-compare ──────────────────────────────────────────────────────────────

export interface CostItem {
  description: string;
  value:       string;
  note?:       string;
  accentColor: AccentColor;
}

export interface CostCompareChart {
  type: 'cost-compare';
  label:       string;
  items:       CostItem[];
  conclusion?: string;
}

// ── timeline-bar ──────────────────────────────────────────────────────────────

export interface TimelineSegment {
  label:       string;
  widthPct:    number;   // 0–100; all segments should sum to ~100
  accentColor: AccentColor;
}

export interface TimelineBarChart {
  type: 'timeline-bar';
  label: string;
  headline: {
    value:       string;
    unit:        string;
    accentColor: AccentColor;
  };
  segments: TimelineSegment[];
  note?:    string;
}

// ── line-chart ────────────────────────────────────────────────────────────────

export interface LineChartPoint {
  x: number;   // actual value (e.g. year: 2004)
  y: number;   // actual value (e.g. count: 72000 or percent: 4)
}

export interface LineSeries {
  id:          string;
  label:       string;
  accentColor: AccentColor;
  dashed:      boolean;
  areaFill:    boolean;
  points:      LineChartPoint[];
}

export interface LineAnnotation {
  x:          number;   // start x value
  spanYears?: number;   // width in x-axis units
  label:      string;
}

export interface LineChartConfig {
  type: 'line-chart';
  label: string;
  xAxis: {
    type: 'year' | 'number';
    min:  number;
    max:  number;
  };
  yAxis: {
    min:    number;
    max:    number;
    format: 'number' | 'percent';
  };
  series:       LineSeries[];
  annotations?: LineAnnotation[];
  note?:        string;
  callout?: {
    text:      string;
    subtext?:  string;
  };
}

// ── component (escape hatch) ──────────────────────────────────────────────────
// Use when the visual is too bespoke for any declarative type.
// componentId must be registered in customRegistry.ts.

export interface ComponentChart {
  type:        'component';
  componentId: string;
  data:        Record<string, unknown>;
}

// ─── Story content block (JSON-serializable) ──────────────────────────────────
// Used in StoryConfig.nodeContent — can be loaded from a JSON file

export type StoryContentBlock =
  | { type: 'text';    title?: string; body: string }
  | { type: 'image';   src: string; caption?: string; alt?: string }
  | { type: 'quote';   text: string; attribution?: string }
  | { type: 'callout'; text: string };

// ─── Story image ──────────────────────────────────────────────────────────────
// Images bound to a story node (not the flowchart). Placed in public/story-images/
// and referenced as "/story-images/filename.jpg". Rendered before statistics in
// the scroll sequence using the same right-panel animation as stat panels.

export interface StoryImage {
  src:      string;    // e.g. "/story-images/my-photo.jpg"
  caption?: string;
  alt?:     string;
}

// ─── Story config (character-specific narrative layer) ───────────────────────
// One StoryConfig per character story — driven by JSON/TS data, no JSX

export interface StoryNodeContent {
  blocks: StoryContentBlock[];
  images?: StoryImage[];  // shown before statistics in the per-node scroll sequence
}

export interface StoryCharacter {
  name: string;
  summary: string;
  heroImage?: string;
  familyImage?: string;
}

export interface StoryIntro {
  title: string;
  description: string;
}

export interface StoryAction {
  label: string;
  description?: string;
  url?: string;
}

export interface StoryEnding {
  title: string;
  description: string;
  actions?: StoryAction[];
}

export interface StoryConfig {
  id: string;
  title: string;
  character: StoryCharacter;
  intro: StoryIntro;
  path: string[];                              // ordered list of StoryNode ids
  nodeContent: Record<string, StoryNodeContent>;
  ending?: StoryEnding;
}
