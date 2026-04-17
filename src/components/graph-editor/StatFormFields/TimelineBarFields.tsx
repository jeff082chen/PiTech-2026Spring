import type { TimelineBarChart, TimelineSegment, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_SEG: TimelineSegment = { label: '', widthPct: 33, accentColor: 'neutral' };

interface Props { chart: TimelineBarChart; onChange: (c: TimelineBarChart) => void; }

export default function TimelineBarFields({ chart, onChange }: Props) {
  const u = (p: Partial<TimelineBarChart>) => onChange({ ...chart, ...p });
  const uh = (p: Partial<TimelineBarChart['headline']>) => u({ headline: { ...chart.headline, ...p } });
  const updateSeg = (i: number, p: Partial<TimelineSegment>) => {
    const segments = [...chart.segments]; segments[i] = { ...segments[i], ...p }; u({ segments });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Headline</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Value</label><input type="text" value={chart.headline.value} onChange={e => uh({ value: e.target.value })} placeholder="18" className={inputCls} /></div>
          <div><label className={labelCls}>Unit</label><input type="text" value={chart.headline.unit} onChange={e => uh({ unit: e.target.value })} placeholder="months average" className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Accent</label><select value={chart.headline.accentColor} onChange={e => uh({ accentColor: e.target.value as AccentColor })} className={inputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Segments (widths should sum to ~100)</label>
          <button onClick={() => u({ segments: [...chart.segments, { ...BLANK_SEG }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Segment</button>
        </div>
        <div className="space-y-2">
          {chart.segments.map((seg, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2 space-y-1.5">
              <div className="flex justify-between"><p className="text-[10px] text-neutral-600">Segment {i + 1}</p><button onClick={() => u({ segments: chart.segments.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button></div>
              <input type="text" value={seg.label} onChange={e => updateSeg(i, { label: e.target.value })} placeholder="Label" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Width % (0–100)</label><input type="number" value={seg.widthPct} onChange={e => updateSeg(i, { widthPct: Number(e.target.value) })} min={0} max={100} className={inputCls} /></div>
                <div><label className={labelCls}>Accent</label><select value={seg.accentColor} onChange={e => updateSeg(i, { accentColor: e.target.value as AccentColor })} className={inputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              </div>
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
