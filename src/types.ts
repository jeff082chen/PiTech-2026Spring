import type { ReactElement } from 'react';

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
  fact?: Fact;
  choices: Choice[];
}

export type StoryNodes = Record<string, StoryNode>;

export type View = 'landing' | 'flow';
