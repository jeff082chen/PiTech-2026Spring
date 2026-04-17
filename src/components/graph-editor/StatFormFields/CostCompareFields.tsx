import type { CostCompareChart, CostItem, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_ITEM: CostItem = { description: '', value: '', accentColor: 'neutral' };

interface Props { chart: CostCompareChart; onChange: (c: CostCompareChart) => void; }

export default function CostCompareFields({ chart, onChange }: Props) {
  const u = (p: Partial<CostCompareChart>) => onChange({ ...chart, ...p });
  const updateItem = (i: number, p: Partial<CostItem>) => {
    const items = [...chart.items]; items[i] = { ...items[i], ...p }; u({ items });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Items (typically 2)</label>
          <button onClick={() => u({ items: [...chart.items, { ...BLANK_ITEM }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Item</button>
        </div>
        <div className="space-y-2">
          {chart.items.map((item, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
              <div className="flex justify-between"><p className="text-[10px] text-neutral-600">Item {i + 1}</p><button onClick={() => u({ items: chart.items.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button></div>
              <input type="text" value={item.description} onChange={e => updateItem(i, { description: e.target.value })} placeholder="Description" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={item.value} onChange={e => updateItem(i, { value: e.target.value })} placeholder="$107,200" className={inputCls} />
                <select value={item.accentColor} onChange={e => updateItem(i, { accentColor: e.target.value as AccentColor })} className={inputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select>
              </div>
              <input type="text" value={item.note ?? ''} onChange={e => updateItem(i, { note: e.target.value || undefined })} placeholder="Note (e.g. per year)" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Conclusion</label>
        <input type="text" value={chart.conclusion ?? ''} onChange={e => u({ conclusion: e.target.value || undefined })} className={inputCls} />
      </div>
    </div>
  );
}
