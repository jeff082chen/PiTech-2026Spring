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
// Lives in src/data/statistics.tsx (TSX, not JSON-serializable)

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
}

export interface Edge {
  from: string;
  to: string;
}

export type StoryNodes = Record<string, StoryNode>;

// ─── Story content block (JSON-serializable) ──────────────────────────────────
// Used in StoryConfig.nodeContent — can be loaded from a JSON file

export type StoryContentBlock =
  | { type: 'text';    title?: string; body: string }
  | { type: 'image';   src: string; caption?: string; alt?: string }
  | { type: 'quote';   text: string; attribution?: string }
  | { type: 'callout'; text: string };

// ─── Story config (character-specific narrative layer) ───────────────────────
// One StoryConfig per character story — driven by JSON/TS data, no JSX

export interface StoryNodeContent {
  blocks: StoryContentBlock[];
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

export interface StoryEnding {
  title: string;
  description: string;
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
