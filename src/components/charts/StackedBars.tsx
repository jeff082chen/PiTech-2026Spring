import type { StackedBarsChart } from '../../types';

export default function StackedBars({ chart }: { chart: StackedBarsChart }) {
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="space-y-4">
        {chart.rows.map(({ label, leftPct }) => {
          const rightPct = 100 - leftPct;
          return (
            <div key={label} className="space-y-1.5">
              <div className="text-neutral-300 text-sm font-medium">{label}</div>
              <div className="flex h-8 rounded-lg overflow-hidden text-xs font-bold">
                <div
                  className="bg-red-600 flex items-center justify-center text-white shrink-0"
                  style={{ width: `${leftPct}%` }}
                >
                  {leftPct}% {chart.leftLabel}
                </div>
                <div className="bg-neutral-700 flex items-center justify-center text-neutral-300 flex-1">
                  {rightPct}% {chart.rightLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {chart.note && (
        <p className="text-neutral-400 text-xs italic pt-1 border-t border-neutral-700">
          {chart.note}
        </p>
      )}
    </div>
  );
}
