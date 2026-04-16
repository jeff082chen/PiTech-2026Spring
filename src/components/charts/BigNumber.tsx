import type { BigNumberChart } from '../../types';
import { ACCENT_TEXT } from './accentMap';

export default function BigNumber({ chart }: { chart: BigNumberChart }) {
  return (
    <div className="w-full text-center space-y-5 px-2">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className={`text-8xl font-black leading-none ${ACCENT_TEXT[chart.accentColor]}`}>
        {chart.value}
      </div>
      {chart.unit && (
        <div className="text-neutral-300 font-semibold text-lg">{chart.unit}</div>
      )}
      {chart.description && (
        <p className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">
          {chart.description}
        </p>
      )}
      {chart.tags && chart.tags.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-left mt-2">
          {chart.tags.map(tag => (
            <div key={tag} className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-400">
              {tag}
            </div>
          ))}
        </div>
      )}
      {chart.footer && (
        <p className="text-neutral-600 text-xs italic">{chart.footer}</p>
      )}
    </div>
  );
}
