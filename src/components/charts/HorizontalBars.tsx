import type { HorizontalBarsChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BG } from './accentMap';

/** Parses **bold** segments into JSX, coloring bold text red-400. */
function parseBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-red-400">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function HorizontalBars({ chart }: { chart: HorizontalBarsChart }) {
  return (
    <div className="w-full space-y-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="space-y-6">
        {chart.bars.map(({ label, pct, accentColor }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-neutral-200 text-sm font-medium">{label}</span>
              <span className={`font-black text-2xl ${ACCENT_TEXT[accentColor]}`}>{pct}%</span>
            </div>
            <div className="h-4 bg-neutral-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${ACCENT_BG[accentColor]} rounded-full`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {chart.callout && (
        <div className="pt-2 border-t border-neutral-700/60">
          <p className="text-neutral-300 text-sm font-semibold text-center">
            {parseBold(chart.callout)}
          </p>
        </div>
      )}
    </div>
  );
}
