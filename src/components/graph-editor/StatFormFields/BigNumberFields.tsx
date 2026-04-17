import type { BigNumberChart, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

interface Props { chart: BigNumberChart; onChange: (c: BigNumberChart) => void; }

export default function BigNumberFields({ chart, onChange }: Props) {
  const u = (p: Partial<BigNumberChart>) => onChange({ ...chart, ...p });
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label (section heading)</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} placeholder="e.g. New York City, 2023" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Value <span className="text-red-500">*</span></label>
          <input type="text" value={chart.value} onChange={e => u({ value: e.target.value })} placeholder='e.g. "28" or "$107K"' className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Unit</label>
          <input type="text" value={chart.unit ?? ''} onChange={e => u({ unit: e.target.value || undefined })} placeholder="years / calls" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Accent Color</label>
        <select value={chart.accentColor} onChange={e => u({ accentColor: e.target.value as AccentColor })} className={inputCls}>
          {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea rows={2} value={chart.description ?? ''} onChange={e => u({ description: e.target.value || undefined })} placeholder="Explanatory sentence below the value" className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls}>Tags (comma-separated)</label>
        <input type="text" value={(chart.tags ?? []).join(', ')} onChange={e => u({ tags: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })} placeholder="Tag A, Tag B" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Footer citation</label>
        <input type="text" value={chart.footer ?? ''} onChange={e => u({ footer: e.target.value || undefined })} placeholder="NY Social Services Law §422" className={inputCls} />
      </div>
    </div>
  );
}
