import type { StoryContentBlock, StatEntry, StatChartConfig } from '../../types';
import rawStats from '../../data/config/statistics.json';
import type { StatisticsConfig } from '../../types';

const STATS = rawStats as unknown as StatisticsConfig;

function getLabel(chart: StatChartConfig): string {
  return chart.type === 'component' ? chart.componentId : chart.label;
}

function getKeyValue(chart: StatChartConfig): string {
  switch (chart.type) {
    case 'big-number':       return `${chart.value}${chart.unit ? ' ' + chart.unit : ''}`;
    case 'two-counter':      return chart.primary.value;
    case 'pipeline':         return `${chart.stages.length} stages`;
    case 'bar-compare':      return chart.bars.map(b => `${b.label}: ${b.value}`).join(' · ');
    case 'card-compare':     return chart.variant === 'stat'
                               ? `${chart.left.value} vs ${chart.right.value}`
                               : `${chart.left.name} vs ${chart.right.name}`;
    case 'horizontal-bars':  return chart.bars.map(b => `${b.pct}%`).join(' · ');
    case 'stacked-bars':     return chart.rows.map(r => `${r.leftPct}% ${chart.leftLabel}`).join(' · ');
    case 'quote-list':       return `"${chart.quotes[0]?.text ?? ''}"`;
    case 'highlight-callout':return chart.highlight.value;
    case 'grid-cards':       return chart.cards.map(c => c.value).join(' · ');
    case 'cost-compare':     return chart.items.map(i => i.value).join(' vs ');
    case 'timeline-bar':     return `${chart.headline.value} ${chart.headline.unit}`;
    case 'line-chart':       return chart.series.map(s => s.label).join(', ');
    case 'component':        return chart.componentId;
    default:                 return '';
  }
}

function statToCallout(entry: StatEntry): StoryContentBlock {
  const key   = getKeyValue(entry.chart);
  const label = getLabel(entry.chart) || entry.id;
  return {
    type: 'callout',
    text: key ? `${label}: ${key}` : label,
  };
}

function statToQuote(entry: StatEntry): StoryContentBlock {
  if (entry.chart.type === 'quote-list') {
    const q = entry.chart.quotes[0];
    return { type: 'quote', text: q?.text ?? '', attribution: q?.attribution };
  }
  return {
    type: 'quote',
    text: getKeyValue(entry.chart),
    attribution: entry.sources[0]?.label,
  };
}

const TYPE_BADGE: Record<string, string> = {
  'big-number':       'bg-red-900/40 text-red-300',
  'two-counter':      'bg-neutral-800 text-neutral-400',
  'pipeline':         'bg-amber-900/40 text-amber-300',
  'bar-compare':      'bg-blue-900/40 text-blue-300',
  'card-compare':     'bg-blue-900/40 text-blue-300',
  'horizontal-bars':  'bg-orange-900/40 text-orange-300',
  'stacked-bars':     'bg-orange-900/40 text-orange-300',
  'quote-list':       'bg-amber-900/40 text-amber-300',
  'highlight-callout':'bg-amber-900/40 text-amber-300',
  'grid-cards':       'bg-green-900/40 text-green-300',
  'cost-compare':     'bg-red-900/40 text-red-300',
  'timeline-bar':     'bg-neutral-800 text-neutral-400',
  'line-chart':       'bg-blue-900/40 text-blue-300',
  'component':        'bg-purple-900/40 text-purple-300',
};

interface Props {
  nodeId: string | null;
  onInsertBlock: (block: StoryContentBlock) => void;
}

export default function StatsLibrary({ nodeId, onInsertBlock }: Props) {
  const entries = nodeId
    ? Object.values(STATS).filter(e => e.nodeId === nodeId)
    : [];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Stats Library
        </p>
        {nodeId && (
          <p className="text-xs text-neutral-600 mt-0.5">
            {entries.length} stat{entries.length !== 1 ? 's' : ''} for this node
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!nodeId && (
          <div className="px-4 py-8 text-center text-neutral-600 text-sm">
            Select a node to see<br />available statistics.
          </div>
        )}

        {nodeId && entries.length === 0 && (
          <div className="px-4 py-8 text-center text-neutral-600 text-sm">
            No pre-written statistics<br />for this node.
          </div>
        )}

        {entries.map(entry => {
          const badgeCls = TYPE_BADGE[entry.chart.type] ?? 'bg-neutral-800 text-neutral-400';
          const keyVal = getKeyValue(entry.chart);

          return (
            <div key={entry.id} className="border-b border-neutral-800/60 px-4 py-3 space-y-2">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-neutral-300 leading-snug flex-1">
                  {getLabel(entry.chart) || entry.id}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${badgeCls}`}>
                  {entry.chart.type}
                </span>
              </div>

              {/* Key value */}
              {keyVal && (
                <p className="text-xs text-neutral-500 italic line-clamp-2">{keyVal}</p>
              )}

              {/* Source */}
              {entry.sources[0] && (
                <p className="text-[10px] text-neutral-700 truncate">
                  {entry.sources[0].label}
                </p>
              )}

              {/* Insert buttons */}
              <div className="flex gap-1.5 pt-0.5">
                <InsertBtn
                  label="→ Callout"
                  onClick={() => onInsertBlock(statToCallout(entry))}
                />
                <InsertBtn
                  label="→ Quote"
                  onClick={() => onInsertBlock(statToQuote(entry))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950/50">
        <p className="text-[10px] text-neutral-700 leading-relaxed">
          Statistics are read-only here. Edit values in{' '}
          <code className="text-neutral-600">statistics.json</code>.
        </p>
      </div>
    </div>
  );
}

function InsertBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors"
    >
      {label}
    </button>
  );
}
