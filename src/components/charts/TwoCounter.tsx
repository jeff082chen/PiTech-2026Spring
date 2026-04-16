import type { TwoCounterChart } from '../../types';
import { ACCENT_TEXT } from './accentMap';

export default function TwoCounter({ chart }: { chart: TwoCounterChart }) {
  const { primary, secondary } = chart;
  return (
    <div className="w-full text-center space-y-8">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="space-y-2">
        <div className={`text-6xl font-black tabular-nums ${ACCENT_TEXT[primary.accentColor] === 'text-neutral-400' ? 'text-white' : ACCENT_TEXT[primary.accentColor]}`}>
          {primary.value}
        </div>
        <p className="text-neutral-300 text-sm">
          {primary.description}
          {primary.qualifier && <span className="text-neutral-500"> {primary.qualifier}</span>}
        </p>
      </div>
      <div className="w-px h-10 bg-neutral-700 mx-auto" />
      <div className="space-y-2">
        <div className={`text-4xl font-black tabular-nums ${ACCENT_TEXT[secondary.accentColor]}`}>
          {secondary.value}
        </div>
        <p className="text-neutral-400 text-sm">
          {secondary.description}
          {secondary.qualifier && <span className="text-neutral-500"> {secondary.qualifier}</span>}
        </p>
      </div>
      {chart.note && (
        <p className="text-neutral-400 text-xs italic border-t border-neutral-700 pt-4">
          {chart.note}
        </p>
      )}
    </div>
  );
}
