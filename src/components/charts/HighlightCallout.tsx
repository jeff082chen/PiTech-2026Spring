import type { HighlightCalloutChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BORDER, ACCENT_BG_SUBTLE, ACCENT_HEADER_TEXT } from './accentMap';

export default function HighlightCallout({ chart }: { chart: HighlightCalloutChart }) {
  const { highlight, bullets } = chart;
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div
        className={`rounded-2xl border ${ACCENT_BORDER[highlight.accentColor]} ${ACCENT_BG_SUBTLE[highlight.accentColor]} p-5 space-y-4 text-center`}
      >
        <div className={`text-5xl font-black leading-none ${ACCENT_TEXT[highlight.accentColor]}`}>
          {highlight.value}
        </div>
        <p className={`text-sm leading-relaxed ${ACCENT_HEADER_TEXT[highlight.accentColor]}`}>
          {highlight.description}
        </p>
      </div>
      <div className="space-y-2 text-sm">
        {bullets.map(line => (
          <div key={line} className="flex gap-2 text-neutral-400">
            <span className="text-red-500 shrink-0">•</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      {chart.note && (
        <p className="text-neutral-600 text-xs italic border-t border-neutral-700 pt-3">
          {chart.note}
        </p>
      )}
    </div>
  );
}
