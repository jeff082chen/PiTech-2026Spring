import type { TimelineBarChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BG } from './accentMap';

export default function TimelineBar({ chart }: { chart: TimelineBarChart }) {
  const { headline, segments } = chart;
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="text-center space-y-1">
        <div className={`text-6xl font-black leading-none ${ACCENT_TEXT[headline.accentColor]}`}>
          {headline.value}
        </div>
        <div className="text-lg font-semibold text-neutral-300">{headline.unit}</div>
      </div>
      <div className="space-y-2.5 pt-2">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-32 shrink-0 text-xs text-neutral-500 text-right">{seg.label}</div>
            <div className="flex-1 h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${ACCENT_BG[seg.accentColor]} rounded-full`}
                style={{ width: `${seg.widthPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {chart.note && (
        <p className="text-xs text-neutral-500 italic text-center border-t border-neutral-700 pt-3">
          {chart.note}
        </p>
      )}
    </div>
  );
}
