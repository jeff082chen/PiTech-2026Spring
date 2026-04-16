import type { BarCompareChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BG } from './accentMap';

const MAX_BAR_HEIGHT = 180; // px — corresponds to heightPct: 100

export default function BarCompare({ chart }: { chart: BarCompareChart }) {
  return (
    <div className="w-full flex flex-col gap-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="flex items-end justify-center gap-12 h-56">
        {chart.bars.map(bar => (
          <div key={bar.label} className="flex flex-col items-center gap-3">
            <span className={`font-black text-3xl ${ACCENT_TEXT[bar.accentColor]}`}>
              {bar.value}
            </span>
            <div
              className={`w-28 rounded-t-xl ${ACCENT_BG[bar.accentColor]}`}
              style={{ height: `${(bar.heightPct / 100) * MAX_BAR_HEIGHT}px` }}
            />
            <span className={`text-sm font-semibold ${ACCENT_TEXT[bar.accentColor]}`}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
      {chart.note && (
        <p className="text-center text-neutral-300 text-sm font-medium whitespace-pre-line">
          {chart.note}
        </p>
      )}
    </div>
  );
}
