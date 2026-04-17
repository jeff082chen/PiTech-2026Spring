import type { TwoCounterChart, CounterItem, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

function CounterBlock({ label, item, onChange }: { label: string; item: CounterItem; onChange: (p: Partial<CounterItem>) => void }) {
  return (
    <div className="border border-neutral-800 rounded-lg p-3 space-y-2">
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Value</label>
          <input type="text" value={item.value} onChange={e => onChange({ value: e.target.value })} placeholder="95,590" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Accent</label>
          <select value={item.accentColor} onChange={e => onChange({ accentColor: e.target.value as AccentColor })} className={inputCls}>
            {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <input type="text" value={item.description} onChange={e => onChange({ description: e.target.value })} placeholder="calls" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Qualifier (optional)</label>
        <input type="text" value={item.qualifier ?? ''} onChange={e => onChange({ qualifier: e.target.value || undefined })} placeholder="(23.1%)" className={inputCls} />
      </div>
    </div>
  );
}

interface Props { chart: TwoCounterChart; onChange: (c: TwoCounterChart) => void; }

export default function TwoCounterFields({ chart, onChange }: Props) {
  const u = (p: Partial<TwoCounterChart>) => onChange({ ...chart, ...p });
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>
      <CounterBlock label="Primary" item={chart.primary} onChange={p => u({ primary: { ...chart.primary, ...p } })} />
      <CounterBlock label="Secondary" item={chart.secondary} onChange={p => u({ secondary: { ...chart.secondary, ...p } })} />
      <div>
        <label className={labelCls}>Note</label>
        <textarea rows={2} value={chart.note ?? ''} onChange={e => u({ note: e.target.value || undefined })} className={`${inputCls} resize-none`} />
      </div>
    </div>
  );
}
