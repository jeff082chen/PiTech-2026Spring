import type { StackedBarsChart, StackedBarRow } from '../../../types';

const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_ROW: StackedBarRow = { label: '', leftPct: 50 };

interface Props { chart: StackedBarsChart; onChange: (c: StackedBarsChart) => void; }

export default function StackedBarsFields({ chart, onChange }: Props) {
  const u = (p: Partial<StackedBarsChart>) => onChange({ ...chart, ...p });
  const updateRow = (i: number, p: Partial<StackedBarRow>) => {
    const rows = [...chart.rows]; rows[i] = { ...rows[i], ...p }; u({ rows });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Left Label (highlighted)</label><input type="text" value={chart.leftLabel} onChange={e => u({ leftLabel: e.target.value })} placeholder="Indicated" className={inputCls} /></div>
        <div><label className={labelCls}>Right Label</label><input type="text" value={chart.rightLabel} onChange={e => u({ rightLabel: e.target.value })} placeholder="Unsubstantiated" className={inputCls} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Rows</label>
          <button onClick={() => u({ rows: [...chart.rows, { ...BLANK_ROW }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Row</button>
        </div>
        <div className="space-y-2">
          {chart.rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={row.label} onChange={e => updateRow(i, { label: e.target.value })} placeholder="Label" className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
              <div className="w-24">
                <input type="number" value={row.leftPct} onChange={e => updateRow(i, { leftPct: Number(e.target.value) })} min={0} max={100} placeholder="Left %" className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
              </div>
              <button onClick={() => u({ rows: chart.rows.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
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
