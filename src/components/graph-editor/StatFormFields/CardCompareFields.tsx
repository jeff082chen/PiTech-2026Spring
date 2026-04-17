import type { CardCompareChart, StatCardData, DistrictCardData, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

interface Props { chart: CardCompareChart; onChange: (c: CardCompareChart) => void; }

function StatCardFields({ label, card, onChange }: { label: string; card: StatCardData; onChange: (p: Partial<StatCardData>) => void }) {
  return (
    <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{label}</p>
      <input type="text" value={card.header} onChange={e => onChange({ header: e.target.value })} placeholder="Header" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={card.preValue ?? ''} onChange={e => onChange({ preValue: e.target.value || undefined })} placeholder="Pre-value text" className={inputCls} />
        <input type="text" value={card.value} onChange={e => onChange({ value: e.target.value })} placeholder="Main value *" className={inputCls} />
      </div>
      <input type="text" value={card.postValue ?? ''} onChange={e => onChange({ postValue: e.target.value || undefined })} placeholder="Post-value text" className={inputCls} />
      <select value={card.accentColor} onChange={e => onChange({ accentColor: e.target.value as AccentColor })} className={inputCls}>
        {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}

function DistrictCardFields({ label, card, onChange }: { label: string; card: DistrictCardData; onChange: (p: Partial<DistrictCardData>) => void }) {
  const updateRow = (i: number, k: string, v: string) => {
    const rows = [...card.rows]; rows[i] = { key: k, value: v }; onChange({ rows });
  };
  return (
    <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={card.name} onChange={e => onChange({ name: e.target.value })} placeholder="Area name" className={inputCls} />
        <input type="text" value={card.subtitle} onChange={e => onChange({ subtitle: e.target.value })} placeholder="Subtitle" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={card.code} onChange={e => onChange({ code: e.target.value })} placeholder="District code" className={inputCls} />
        <select value={card.accentColor} onChange={e => onChange({ accentColor: e.target.value as AccentColor })} className={inputCls}>
          {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        {card.rows.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            <input type="text" value={row.key} onChange={e => updateRow(i, e.target.value, row.value)} placeholder="Key" className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
            <input type="text" value={row.value} onChange={e => updateRow(i, row.key, e.target.value)} placeholder="Value" className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
            <button onClick={() => onChange({ rows: card.rows.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
          </div>
        ))}
        <button onClick={() => onChange({ rows: [...card.rows, { key: '', value: '' }] })} className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">+ Row</button>
      </div>
    </div>
  );
}

export default function CardCompareFields({ chart, onChange }: Props) {
  const isDistrict = chart.variant === 'district';

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Variant</label>
        <select
          value={chart.variant}
          onChange={e => {
            const v = e.target.value as 'stat' | 'district';
            if (v === 'stat') {
              onChange({ type: 'card-compare', variant: 'stat', label: chart.label, note: (chart as { note?: string }).note, left: { header: '', accentColor: 'neutral', value: '', postValue: '' }, right: { header: '', accentColor: 'neutral', value: '', postValue: '' } });
            } else {
              onChange({ type: 'card-compare', variant: 'district', label: chart.label, note: (chart as { note?: string }).note, left: { name: '', subtitle: '', code: '', accentColor: 'red', rows: [] }, right: { name: '', subtitle: '', code: '', accentColor: 'neutral', rows: [] } });
            }
          }}
          className={inputCls}
        >
          <option value="stat">stat</option>
          <option value="district">district</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => onChange({ ...chart, label: e.target.value } as CardCompareChart)} className={inputCls} />
      </div>

      {isDistrict ? (
        <>
          <DistrictCardFields label="Left" card={(chart as Extract<CardCompareChart, { variant: 'district' }>).left} onChange={p => onChange({ ...chart, left: { ...(chart as Extract<CardCompareChart, { variant: 'district' }>).left, ...p } } as CardCompareChart)} />
          <DistrictCardFields label="Right" card={(chart as Extract<CardCompareChart, { variant: 'district' }>).right} onChange={p => onChange({ ...chart, right: { ...(chart as Extract<CardCompareChart, { variant: 'district' }>).right, ...p } } as CardCompareChart)} />
        </>
      ) : (
        <>
          <StatCardFields label="Left" card={(chart as Extract<CardCompareChart, { variant: 'stat' }>).left} onChange={p => onChange({ ...chart, left: { ...(chart as Extract<CardCompareChart, { variant: 'stat' }>).left, ...p } } as CardCompareChart)} />
          <StatCardFields label="Right" card={(chart as Extract<CardCompareChart, { variant: 'stat' }>).right} onChange={p => onChange({ ...chart, right: { ...(chart as Extract<CardCompareChart, { variant: 'stat' }>).right, ...p } } as CardCompareChart)} />
        </>
      )}

      <div>
        <label className={labelCls}>Note</label>
        <input type="text" value={(chart as { note?: string }).note ?? ''} onChange={e => onChange({ ...chart, note: e.target.value || undefined } as CardCompareChart)} className={inputCls} />
      </div>
    </div>
  );
}
