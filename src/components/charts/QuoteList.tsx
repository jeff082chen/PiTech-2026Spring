import type { QuoteListChart } from '../../types';

export default function QuoteList({ chart }: { chart: QuoteListChart }) {
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <div className="space-y-4">
        {chart.quotes.map(({ text, attribution }) => (
          <blockquote
            key={text}
            className="border-l-2 border-red-500 pl-4 text-neutral-200 text-sm font-semibold leading-relaxed italic"
          >
            {text}
            {attribution && (
              <footer className="text-neutral-500 text-xs font-normal not-italic mt-1">
                — {attribution}
              </footer>
            )}
          </blockquote>
        ))}
      </div>
      {chart.note && (
        <p className="text-neutral-500 text-xs italic pt-1 border-t border-neutral-700">
          {chart.note}
        </p>
      )}
    </div>
  );
}
