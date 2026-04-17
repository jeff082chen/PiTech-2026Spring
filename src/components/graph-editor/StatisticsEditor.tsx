import type { NodeConfigEntry, StatisticsConfig } from '../../types';

interface Props {
  nodeId:      string;
  node:        NodeConfigEntry;
  statsConfig: StatisticsConfig;
  onDeleteStat:        (statId: string) => void;
  onReorderStats:      (nodeId: string, newOrder: string[]) => void;
  onOpenStatForm:      (nodeId: string, statId: string | 'new') => void;
}

export default function StatisticsEditor({
  nodeId, node, statsConfig,
  onDeleteStat, onReorderStats, onOpenStatForm,
}: Props) {
  const statIds = node.statisticIds ?? [];
  const stats   = statIds.map(id => statsConfig[id]).filter(Boolean) as NonNullable<StatisticsConfig[string]>[];

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...statIds];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorderStats(nodeId, next);
  };
  const moveDown = (idx: number) => {
    if (idx === statIds.length - 1) return;
    const next = [...statIds];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorderStats(nodeId, next);
  };

  const handleDelete = (statId: string) => {
    if (!window.confirm('Delete this statistic?\n\nThis cannot be undone.')) return;
    onDeleteStat(statId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Statistics</p>
        <button
          onClick={() => onOpenStatForm(nodeId, 'new')}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          + Add Stat
        </button>
      </div>

      {stats.length === 0 && (
        <p className="text-xs text-neutral-700 italic">No statistics attached to this node.</p>
      )}

      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div
            key={stat.id}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-300 truncate">{stat.id}</p>
              <p className="text-[10px] text-neutral-600">{stat.chart.type}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30 text-xs px-1 transition-colors"
                title="Move up"
              >↑</button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === statIds.length - 1}
                className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30 text-xs px-1 transition-colors"
                title="Move down"
              >↓</button>
              <button
                onClick={() => onOpenStatForm(nodeId, stat.id)}
                className="text-neutral-500 hover:text-neutral-200 text-xs px-1.5 transition-colors"
              >Edit</button>
              <button
                onClick={() => handleDelete(stat.id)}
                className="text-neutral-400 hover:text-red-400 text-xs px-1 transition-colors"
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
