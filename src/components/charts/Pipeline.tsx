import type { PipelineChart } from '../../types';
import { ACCENT_HEX_BG } from './accentMap';

export default function Pipeline({ chart }: { chart: PipelineChart }) {
  return (
    <div className="w-full space-y-3">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      {chart.stages.map(({ label, pct, color, note }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-14 text-right text-xs text-neutral-400 shrink-0 font-mono">{note}</div>
          <div
            className="h-8 rounded-lg flex items-center px-3 text-xs text-white font-semibold truncate shrink-0"
            style={{
              width: `calc(${pct}% - 3.5rem)`,
              backgroundColor: ACCENT_HEX_BG[color],
              minWidth: '3rem',
            }}
          >
            {pct >= 30 ? label : ''}
          </div>
          {pct < 30 && <span className="text-neutral-400 text-xs shrink-0">{label}</span>}
        </div>
      ))}
    </div>
  );
}
