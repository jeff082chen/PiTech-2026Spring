import type { GridCardsChart } from '../../types';
import { ACCENT_TEXT, ACCENT_BORDER, ACCENT_BG_SUBTLE, ACCENT_HEADER_TEXT } from './accentMap';

const COL_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

export default function GridCards({ chart }: { chart: GridCardsChart }) {
  const colored = chart.cardStyle === 'colored';
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className={`grid ${COL_CLASS[chart.columns]} gap-3`}>
        {chart.cards.map(({ value, description, accentColor }) => (
          <div
            key={description}
            className={`rounded-2xl p-4 text-center space-y-1 border ${
              colored
                ? `${ACCENT_BORDER[accentColor]} ${ACCENT_BG_SUBTLE[accentColor]}`
                : 'border-neutral-700 bg-neutral-800/40'
            }`}
          >
            <div
              className={`text-3xl font-black leading-none ${ACCENT_TEXT[accentColor]}`}
            >
              {value}
            </div>
            <div
              className={`text-xs leading-snug ${
                colored ? ACCENT_HEADER_TEXT[accentColor] : 'text-neutral-500'
              }`}
            >
              {description}
            </div>
          </div>
        ))}
      </div>
      {chart.infoBox && (
        <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-400 space-y-1.5">
          <p className="font-semibold text-neutral-300">{chart.infoBox.title}</p>
          {chart.infoBox.bullets.map(b => (
            <p key={b}>• {b}</p>
          ))}
        </div>
      )}
    </div>
  );
}
