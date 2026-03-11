import type { ReactElement } from 'react';

export type NodeCategory = 'hotline' | 'cares' | 'warning' | 'investigation' | 'court' | 'neutral';

export interface Choice {
  text: string;
  nextNodeId: string;
}

export interface Fact {
  title: string;
  content: string;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  icon: ReactElement;
  x: number;
  y: number;
  category: NodeCategory;
  fact?: Fact;
  choices: Choice[];
}

export interface Edge {
  from: string;
  to: string;
}

export type StoryNodes = Record<string, StoryNode>;
