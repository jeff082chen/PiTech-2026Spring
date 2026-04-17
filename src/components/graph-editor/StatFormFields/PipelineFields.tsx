import type { PipelineChart, PipelineStage, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_STAGE: PipelineStage = { label: '', pct: 100, note: '', color: 'neutral' };

interface Props { chart: PipelineChart; onChange: (c: PipelineChart) => void; }

export default function PipelineFields({ chart, onChange }: Props) {
  const u = (p: Partial<PipelineChart>) => onChange({ ...chart, ...p });
  const updateStage = (i: number, p: Partial<PipelineStage>) => {
    const stages = [...chart.stages];
    stages[i] = { ...stages[i], ...p };
    u({ stages });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Stages</label>
          <button onClick={() => u({ stages: [...chart.stages, { ...BLANK_STAGE }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Stage</button>
        </div>
        <div className="space-y-2">
          {chart.stages.map((stage, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-neutral-600">Stage {i + 1}</p>
                <button onClick={() => u({ stages: chart.stages.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
              <input type="text" value={stage.label} onChange={e => updateStage(i, { label: e.target.value })} placeholder="Label" className={inputCls} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>% width</label>
                  <input type="number" value={stage.pct} onChange={e => updateStage(i, { pct: Number(e.target.value) })} min={0} max={100} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Note</label>
                  <input type="text" value={stage.note} onChange={e => updateStage(i, { note: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <select value={stage.color} onChange={e => updateStage(i, { color: e.target.value as AccentColor })} className={inputCls}>
                    {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
