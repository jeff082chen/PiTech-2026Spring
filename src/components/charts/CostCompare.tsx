import type { CostCompareChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BORDER, ACCENT_BG_SUBTLE } from './accentMap';

export default function CostCompare({ chart }: { chart: CostCompareChart }) {
  return (
    <div className="w-full text-center space-y-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      {chart.items.map(({ description, value, note, accentColor }, idx) => (
        <div key={description}>
          <div
            className={`rounded-2xl border ${ACCENT_BORDER[accentColor]} ${ACCENT_BG_SUBTLE[accentColor]} p-6`}
          >
            <div className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
              {description}
            </div>
            <div className={`text-6xl font-black tabular-nums ${ACCENT_TEXT[accentColor]}`}>
              {value}
            </div>
            {note && (
              <div className="text-neutral-400 text-sm mt-1">{note}</div>
            )}
          </div>
          {idx < chart.items.length - 1 && (
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-neutral-700" />
              <span className="text-neutral-600 text-sm font-bold uppercase tracking-wider">vs.</span>
              <div className="flex-1 h-px bg-neutral-700" />
            </div>
          )}
        </div>
      ))}
      {chart.conclusion && (
        <p className="text-neutral-400 text-sm font-semibold">{chart.conclusion}</p>
      )}
    </div>
  );
}
