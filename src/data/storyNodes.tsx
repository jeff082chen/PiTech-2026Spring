// ─── storyNodes.tsx ───────────────────────────────────────────────────────────
// Adapter layer: converts nodes.json + statistics.json into runtime StoryNode objects.
//
// Editing the flowchart graph:
//   → Edit src/data/config/nodes.json    (title, description, x/y, icon, choices)
//   → Edit src/config/iconRegistry.ts    (only when adding a brand-new icon)
//
// Editing statistics:
//   → Edit src/data/config/statistics.json

import rawNodes from './config/nodes.json';
import rawStats from './config/statistics.json';
import { ICON_REGISTRY } from '../config/iconRegistry';
import StatRenderer from '../components/charts/StatRenderer';
import type { StoryNode, StoryNodes, Edge, NodesFile, StatisticsConfig, NodeStatistic } from '../types';

const nodesFile  = rawNodes as unknown as NodesFile;
const statsFile  = rawStats as unknown as StatisticsConfig;

export const EDGES: Edge[] = nodesFile.edges;

const STORY_NODES: StoryNodes = Object.fromEntries(
  Object.entries(nodesFile.nodes).map(([id, cfg]) => {
    const IconComp = ICON_REGISTRY[cfg.icon];
    const iconClass = `w-8 h-8 md:w-12 md:h-12 ${cfg.iconColor ?? 'text-neutral-400'}`;

    // Resolve statisticIds → NodeStatistic[] via statistics.json
    const statistics: NodeStatistic[] = (cfg.statisticIds ?? []).flatMap(statId => {
      const entry = statsFile[statId];
      if (!entry) return [];
      return [{
        id:      entry.id,
        sources: entry.sources,
        component: <StatRenderer chart={entry.chart} />,
      }];
    });

    const node: StoryNode = {
      id:             cfg.id,
      title:          cfg.title,
      description:    cfg.description,
      x:              cfg.x,
      y:              cfg.y,
      category:       cfg.category,
      choices:        cfg.choices,
      statistics,
      nodeType:       cfg.nodeType,
      parentPrimaryId: cfg.parentPrimaryId,
      icon: IconComp
        ? <IconComp className={iconClass} />
        : <span className={iconClass} title={cfg.icon} />,
    };

    return [id, node];
  })
);

export default STORY_NODES;
