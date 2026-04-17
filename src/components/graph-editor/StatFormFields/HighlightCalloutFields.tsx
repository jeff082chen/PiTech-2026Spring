import type { HighlightCalloutChart, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

interface Props { chart: HighlightCalloutChart; onChange: (c: HighlightCalloutChart) => void; }

export default function HighlightCalloutFields({ chart, onChange }: Props) {
  const u = (p: Partial<HighlightCalloutChart>) => onChange({ ...chart, ...p });
  const uh = (p: Partial<HighlightCalloutChart['highlight']>) => u({ highlight: { ...chart.highlight, ...p } });

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div className="border border-neutral-800 rounded-lg p-3 space-y-2">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Highlight</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Value</label><input type="text" value={chart.highlight.value} onChange={e => uh({ value: e.target.value })} placeholder="9 in 10" className={inputCls} /></div>
          <div><label className={labelCls}>Accent</label><select value={chart.highlight.accentColor} onChange={e => uh({ accentColor: e.target.value as AccentColor })} className={inputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
        </div>
        <div><label className={labelCls}>Description</label><input type="text" value={chart.highlight.description} onChange={e => uh({ description: e.target.value })} placeholder="families report coercion" className={inputCls} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Bullets</label>
          <button onClick={() => u({ bullets: [...chart.bullets, ''] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add</button>
        </div>
        <div className="space-y-1.5">
          {chart.bullets.map((b, i) => (
            <div key={i} className="flex gap-1.5">
              <input type="text" value={b} onChange={e => { const bullets = [...chart.bullets]; bullets[i] = e.target.value; u({ bullets }); }} className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
              <button onClick={() => u({ bullets: chart.bullets.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Note</label>
        <input type="text" value={chart.note ?? ''} onChange={e => u({ note: e.target.value || undefined })} className={inputCls} />
      </div>
    </div>
  );
}
