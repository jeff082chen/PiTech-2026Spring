import type { LineChartConfig, LineSeries, LineChartPoint, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';
const minInputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500';

const BLANK_SERIES: LineSeries = { id: '', label: '', accentColor: 'red', dashed: false, areaFill: false, points: [] };

interface Props { chart: LineChartConfig; onChange: (c: LineChartConfig) => void; }

export default function LineChartFields({ chart, onChange }: Props) {
  const u = (p: Partial<LineChartConfig>) => onChange({ ...chart, ...p });

  const updateSeries = (i: number, p: Partial<LineSeries>) => {
    const series = [...chart.series]; series[i] = { ...series[i], ...p }; u({ series });
  };
  const updatePoint = (si: number, pi: number, p: Partial<LineChartPoint>) => {
    const series = [...chart.series];
    const points = [...series[si].points]; points[pi] = { ...points[pi], ...p };
    series[si] = { ...series[si], points }; u({ series });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      {/* X Axis */}
      <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">X Axis</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={labelCls}>Type</label><select value={chart.xAxis.type} onChange={e => u({ xAxis: { ...chart.xAxis, type: e.target.value as 'year' | 'number' } })} className={inputCls}><option value="year">year</option><option value="number">number</option></select></div>
          <div><label className={labelCls}>Min</label><input type="number" value={chart.xAxis.min} onChange={e => u({ xAxis: { ...chart.xAxis, min: Number(e.target.value) } })} className={inputCls} /></div>
          <div><label className={labelCls}>Max</label><input type="number" value={chart.xAxis.max} onChange={e => u({ xAxis: { ...chart.xAxis, max: Number(e.target.value) } })} className={inputCls} /></div>
        </div>
      </div>

      {/* Y Axis */}
      <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Y Axis</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={labelCls}>Min</label><input type="number" value={chart.yAxis.min} onChange={e => u({ yAxis: { ...chart.yAxis, min: Number(e.target.value) } })} className={inputCls} /></div>
          <div><label className={labelCls}>Max</label><input type="number" value={chart.yAxis.max} onChange={e => u({ yAxis: { ...chart.yAxis, max: Number(e.target.value) } })} className={inputCls} /></div>
          <div><label className={labelCls}>Format</label><select value={chart.yAxis.format} onChange={e => u({ yAxis: { ...chart.yAxis, format: e.target.value as 'number' | 'percent' } })} className={inputCls}><option value="number">number</option><option value="percent">percent</option></select></div>
        </div>
      </div>

      {/* Series */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Series</label>
          <button onClick={() => u({ series: [...chart.series, { ...BLANK_SERIES, id: `series-${Date.now()}` }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Series</button>
        </div>
        <div className="space-y-2">
          {chart.series.map((ser, si) => (
            <div key={si} className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
              <div className="flex justify-between"><p className="text-[10px] text-neutral-600">Series {si + 1}</p><button onClick={() => u({ series: chart.series.filter((_, j) => j !== si) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button></div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={ser.label} onChange={e => updateSeries(si, { label: e.target.value })} placeholder="Label" className={minInputCls} />
                <select value={ser.accentColor} onChange={e => updateSeries(si, { accentColor: e.target.value as AccentColor })} className={minInputCls}>{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                  <input type="checkbox" checked={ser.dashed} onChange={e => updateSeries(si, { dashed: e.target.checked })} className="rounded" /> Dashed
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                  <input type="checkbox" checked={ser.areaFill} onChange={e => updateSeries(si, { areaFill: e.target.checked })} className="rounded" /> Area Fill
                </label>
              </div>
              {/* Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-neutral-600">Points (x, y)</p>
                  <button onClick={() => updateSeries(si, { points: [...ser.points, { x: chart.xAxis.min, y: 0 }] })} className="text-[10px] text-neutral-700 hover:text-neutral-400 transition-colors">+ Add</button>
                </div>
                <div className="space-y-1">
                  {ser.points.map((pt, pi) => (
                    <div key={pi} className="flex gap-1.5 items-center">
                      <input type="number" value={pt.x} onChange={e => updatePoint(si, pi, { x: Number(e.target.value) })} className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-400 focus:outline-none focus:border-neutral-500" />
                      <input type="number" value={pt.y} onChange={e => updatePoint(si, pi, { y: Number(e.target.value) })} className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-400 focus:outline-none focus:border-neutral-500" />
                      <button onClick={() => updateSeries(si, { points: ser.points.filter((_, j) => j !== pi) })} className="text-neutral-700 hover:text-red-400 text-[10px] px-1 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Annotations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Annotations</label>
          <button onClick={() => u({ annotations: [...(chart.annotations ?? []), { x: chart.xAxis.min, label: '' }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add</button>
        </div>
        {(chart.annotations ?? []).map((ann, i) => (
          <div key={i} className="flex gap-1.5 items-center mb-1.5">
            <input type="number" value={ann.x} onChange={e => { const a = [...(chart.annotations ?? [])]; a[i] = { ...a[i], x: Number(e.target.value) }; u({ annotations: a }); }} className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
            <input type="text" value={ann.label} onChange={e => { const a = [...(chart.annotations ?? [])]; a[i] = { ...a[i], label: e.target.value }; u({ annotations: a }); }} placeholder="Label" className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
            <button onClick={() => u({ annotations: (chart.annotations ?? []).filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
          </div>
        ))}
      </div>

      <div>
        <label className={labelCls}>Note</label>
        <input type="text" value={chart.note ?? ''} onChange={e => u({ note: e.target.value || undefined })} className={inputCls} />
      </div>
    </div>
  );
}
