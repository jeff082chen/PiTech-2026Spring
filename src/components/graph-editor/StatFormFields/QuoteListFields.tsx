import type { QuoteListChart, QuoteItem } from '../../../types';

const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

interface Props { chart: QuoteListChart; onChange: (c: QuoteListChart) => void; }

export default function QuoteListFields({ chart, onChange }: Props) {
  const u = (p: Partial<QuoteListChart>) => onChange({ ...chart, ...p });
  const updateQuote = (i: number, p: Partial<QuoteItem>) => {
    const quotes = [...chart.quotes]; quotes[i] = { ...quotes[i], ...p }; u({ quotes });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Quotes</label>
          <button onClick={() => u({ quotes: [...chart.quotes, { text: '' }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Quote</button>
        </div>
        <div className="space-y-2">
          {chart.quotes.map((q, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
              <div className="flex justify-between">
                <p className="text-[10px] text-neutral-600">Quote {i + 1}</p>
                <button onClick={() => u({ quotes: chart.quotes.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
              <textarea rows={2} value={q.text} onChange={e => updateQuote(i, { text: e.target.value })} placeholder='"Quote text here"' className={`${inputCls} resize-none`} />
              <input type="text" value={q.attribution ?? ''} onChange={e => updateQuote(i, { attribution: e.target.value || undefined })} placeholder="Attribution (optional)" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Note</label>
        <input type="text" value={chart.note ?? ''} onChange={e => u({ note: e.target.value || undefined })} className={inputCls} />
      </div>
    </div>
  );
}
