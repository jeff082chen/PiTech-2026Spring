import type { CardCompareChart } from '../../types';
import {
  ACCENT_TEXT, ACCENT_BORDER, ACCENT_HEADER_BG, ACCENT_HEADER_TEXT,
} from './accentMap';

export default function CardCompare({ chart }: { chart: CardCompareChart }) {
  if (chart.variant === 'district') {
    const { left, right } = chart;
    return (
      <div className="w-full space-y-4">
        <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
          {chart.label}
        </p>
        <div className="flex gap-3">
          {[left, right].map(card => (
            <div
              key={card.code}
              className={`flex-1 rounded-2xl overflow-hidden border ${ACCENT_BORDER[card.accentColor]}`}
            >
              <div className={`px-4 py-3 ${ACCENT_HEADER_BG[card.accentColor]}`}>
                <div className={`font-black text-base leading-tight ${ACCENT_HEADER_TEXT[card.accentColor]}`}>
                  {card.name}
                </div>
                <div className="text-neutral-500 text-xs">{card.subtitle}</div>
                <div className="text-neutral-600 text-xs mt-0.5">{card.code}</div>
              </div>
              <div className="bg-neutral-900/60 px-4 py-3 space-y-2.5">
                {card.rows.map(({ key, value }) => (
                  <div key={key} className="flex justify-between items-baseline">
                    <span className="text-neutral-500 text-xs leading-tight max-w-[55%]">{key}</span>
                    <span className={`font-black text-base ${ACCENT_HEADER_TEXT[card.accentColor]}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {chart.note && (
          <p className="text-neutral-400 text-sm text-center font-medium">{chart.note}</p>
        )}
      </div>
    );
  }

  // variant === 'stat'
  const { left, right } = chart;
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="flex gap-4">
        {[left, right].map(card => (
          <div
            key={card.header}
            className={`flex-1 rounded-2xl overflow-hidden border ${ACCENT_BORDER[card.accentColor]}`}
          >
            <div className={`px-4 py-2 text-center ${ACCENT_HEADER_BG[card.accentColor]}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${ACCENT_HEADER_TEXT[card.accentColor]}`}>
                {card.header}
              </span>
            </div>
            <div className="bg-neutral-900 p-5 text-center space-y-2">
              {card.preValue && (
                <div className="text-neutral-400 text-sm">{card.preValue}</div>
              )}
              <div className={`text-6xl font-black leading-none mt-2 ${ACCENT_TEXT[card.accentColor]}`}>
                {card.value}
              </div>
              {card.postValue && (
                <div className="text-xs text-neutral-500 mt-1">{card.postValue}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {chart.note && (
        <p className="text-center text-neutral-300 text-sm font-medium">{chart.note}</p>
      )}
    </div>
  );
}
