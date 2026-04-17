import type { HorizontalBarsChart, HorizontalBar, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_BAR: HorizontalBar = { label: '', pct: 50, accentColor: 'neutral' };

interface Props { chart: HorizontalBarsChart; onChange: (c: HorizontalBarsChart) => void; }

export default function HorizontalBarsFields({ chart, onChange }: Props) {
  const u = (p: Partial<HorizontalBarsChart>) => onChange({ ...chart, ...p });
  const updateBar = (i: number, p: Partial<HorizontalBar>) => {
    const bars = [...chart.bars]; bars[i] = { ...bars[i], ...p }; u({ bars });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Bars</label>
          <button onClick={() => u({ bars: [...chart.bars, { ...BLANK_BAR }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Bar</button>
        </div>
        <div className="space-y-2">
          {chart.bars.map((bar, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2 space-y-2">
              <div className="flex justify-between">
                <p className="text-[10px] text-neutral-600">Bar {i + 1}</p>
                <button onClick={() => u({ bars: chart.bars.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
              <input type="text" value={bar.label} onChange={e => updateBar(i, { label: e.target.value })} placeholder="Label" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>% (0–100)</label><input type="number" value={bar.pct} onChange={e => updateBar(i, { pct: Number(e.target.value) })} min={0} max={100} className={inputCls} /></div>
                <div><label className={labelCls}>Accent</label><select value={bar.accentColor} onChange={e => updateBar(i, { accentColor: e.target.value as AccentColor })} className={inputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Callout (supports **bold**)</label>
        <textarea rows={2} value={chart.callout ?? ''} onChange={e => u({ callout: e.target.value || undefined })} className={`${inputCls} resize-none`} />
      </div>
    </div>
  );
}
