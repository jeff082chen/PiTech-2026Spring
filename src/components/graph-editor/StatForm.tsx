import { useState, Component, type ReactNode } from 'react';
import type { StatChartConfig, StatEntry, AccentColor } from '../../types';
import StatRenderer from '../charts/StatRenderer';
import BigNumberFields       from './StatFormFields/BigNumberFields';
import TwoCounterFields      from './StatFormFields/TwoCounterFields';
import PipelineFields        from './StatFormFields/PipelineFields';
import BarCompareFields      from './StatFormFields/BarCompareFields';
import CardCompareFields     from './StatFormFields/CardCompareFields';
import HorizontalBarsFields  from './StatFormFields/HorizontalBarsFields';
import StackedBarsFields     from './StatFormFields/StackedBarsFields';
import QuoteListFields       from './StatFormFields/QuoteListFields';
import HighlightCalloutFields from './StatFormFields/HighlightCalloutFields';
import GridCardsFields       from './StatFormFields/GridCardsFields';
import CostCompareFields     from './StatFormFields/CostCompareFields';
import TimelineBarFields     from './StatFormFields/TimelineBarFields';
import LineChartFields       from './StatFormFields/LineChartFields';

// ── Preview error boundary ────────────────────────────────────────────────────

class PreviewBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidUpdate(prevProps: { children: ReactNode }) {
    if (prevProps.children !== this.props.children) this.setState({ error: false });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-32 text-neutral-600 text-xs italic text-center px-4">
          Fill in required fields to see preview
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Chart type → blank template ───────────────────────────────────────────────

const BLANK: Record<string, StatChartConfig> = {
  'big-number':        { type: 'big-number',        label: '', value: '', accentColor: 'neutral' },
  'two-counter':       { type: 'two-counter',       label: '', primary: { value: '', description: '', accentColor: 'neutral' }, secondary: { value: '', description: '', accentColor: 'neutral' } },
  'pipeline':          { type: 'pipeline',          label: '', stages: [] },
  'bar-compare':       { type: 'bar-compare',       label: '', bars: [] },
  'card-compare':      { type: 'card-compare',      variant: 'stat', label: '', left: { header: '', accentColor: 'neutral', value: '', postValue: '' }, right: { header: '', accentColor: 'neutral', value: '', postValue: '' } },
  'horizontal-bars':   { type: 'horizontal-bars',   label: '', bars: [] },
  'stacked-bars':      { type: 'stacked-bars',      label: '', leftLabel: '', rightLabel: '', rows: [] },
  'quote-list':        { type: 'quote-list',        label: '', quotes: [] },
  'highlight-callout': { type: 'highlight-callout', label: '', highlight: { value: '', description: '', accentColor: 'neutral' as AccentColor }, bullets: [] },
  'grid-cards':        { type: 'grid-cards',        label: '', columns: 2, cards: [] },
  'cost-compare':      { type: 'cost-compare',      label: '', items: [] },
  'timeline-bar':      { type: 'timeline-bar',      label: '', headline: { value: '', unit: '', accentColor: 'neutral' }, segments: [] },
  'line-chart':        { type: 'line-chart',        label: '', xAxis: { type: 'year', min: 2000, max: 2023 }, yAxis: { min: 0, max: 100, format: 'number' }, series: [] },
  'component':         { type: 'component',         componentId: '', data: {} },
};

const CHART_TYPES = Object.keys(BLANK) as Array<keyof typeof BLANK>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialChart?:  StatChartConfig;
  initialSources?: StatEntry['sources'];
  onSave:   (chart: StatChartConfig, sources: StatEntry['sources']) => void;
  onCancel: () => void;
}

export default function StatForm({ initialChart, initialSources, onSave, onCancel }: Props) {
  const [chart,   setChart]   = useState<StatChartConfig>(initialChart ?? BLANK['big-number']);
  const [sources, setSources] = useState<StatEntry['sources']>(initialSources ?? []);

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
  const labelCls = 'block text-xs text-neutral-500 mb-1';

  const handleTypeChange = (newType: string) => {
    setChart((BLANK[newType] ?? BLANK['big-number']) as StatChartConfig);
  };

  const renderFields = () => {
    switch (chart.type) {
      case 'big-number':        return <BigNumberFields        chart={chart} onChange={setChart} />;
      case 'two-counter':       return <TwoCounterFields       chart={chart} onChange={setChart} />;
      case 'pipeline':          return <PipelineFields         chart={chart} onChange={setChart} />;
      case 'bar-compare':       return <BarCompareFields       chart={chart} onChange={setChart} />;
      case 'card-compare':      return <CardCompareFields      chart={chart} onChange={setChart} />;
      case 'horizontal-bars':   return <HorizontalBarsFields   chart={chart} onChange={setChart} />;
      case 'stacked-bars':      return <StackedBarsFields      chart={chart} onChange={setChart} />;
      case 'quote-list':        return <QuoteListFields        chart={chart} onChange={setChart} />;
      case 'highlight-callout': return <HighlightCalloutFields chart={chart} onChange={setChart} />;
      case 'grid-cards':        return <GridCardsFields        chart={chart} onChange={setChart} />;
      case 'cost-compare':      return <CostCompareFields      chart={chart} onChange={setChart} />;
      case 'timeline-bar':      return <TimelineBarFields      chart={chart} onChange={setChart} />;
      case 'line-chart':        return <LineChartFields        chart={chart} onChange={setChart} />;
      case 'component':
        return (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Component ID</label>
              <input
                type="text"
                value={chart.componentId}
                onChange={e => setChart({ ...chart, componentId: e.target.value })}
                placeholder="e.g. WarrantBox"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Data (JSON)</label>
              <textarea
                rows={6}
                value={JSON.stringify(chart.data, null, 2)}
                onChange={e => {
                  try { setChart({ ...chart, data: JSON.parse(e.target.value) }); } catch { /* ignore */ }
                }}
                className={`${inputCls} resize-none font-mono text-xs`}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Two-column: form left, preview right */}
      <div className="flex gap-6 min-h-0">
        {/* Form column */}
        <div className="flex-1 space-y-3 min-w-0 pr-1">
          {/* Chart type selector */}
          <div>
            <label className={labelCls}>Chart Type</label>
            <select
              value={chart.type}
              onChange={e => handleTypeChange(e.target.value)}
              className={inputCls}
            >
              {CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Type-specific fields */}
          {renderFields()}

          {/* Sources */}
          <div className="border-t border-neutral-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Sources</label>
              <button
                onClick={() => setSources(s => [...s, { label: '' }])}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >+ Add</button>
            </div>
            <div className="space-y-1.5">
              {sources.map((src, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={src.label}
                    onChange={e => {
                      const next = [...sources];
                      next[i] = { ...next[i], label: e.target.value };
                      setSources(next);
                    }}
                    placeholder="Source label"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-neutral-500"
                  />
                  <input
                    type="text"
                    value={src.url ?? ''}
                    onChange={e => {
                      const next = [...sources];
                      next[i] = { ...next[i], url: e.target.value || undefined };
                      setSources(next);
                    }}
                    placeholder="URL (optional)"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-neutral-500"
                  />
                  <button
                    onClick={() => setSources(s => s.filter((_, j) => j !== i))}
                    className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-neutral-950 pb-1">
            <button
              onClick={() => onSave(chart, sources)}
              className="flex-1 py-2 rounded bg-neutral-200 hover:bg-white text-neutral-900 text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Preview column */}
        <div className="w-80 shrink-0 border-l border-neutral-800 pl-6">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Preview</p>
          <div className="bg-neutral-900 rounded-xl p-3 overflow-hidden">
            <PreviewBoundary>
              <StatRenderer chart={chart} />
            </PreviewBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
