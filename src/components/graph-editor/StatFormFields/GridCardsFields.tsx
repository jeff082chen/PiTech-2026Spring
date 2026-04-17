import type { GridCardsChart, GridCard, AccentColor } from '../../../types';

const ACCENTS: AccentColor[] = ['red', 'amber', 'orange', 'green', 'blue', 'pink', 'neutral'];
const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

const BLANK_CARD: GridCard = { value: '', description: '', accentColor: 'neutral' };

interface Props { chart: GridCardsChart; onChange: (c: GridCardsChart) => void; }

export default function GridCardsFields({ chart, onChange }: Props) {
  const u = (p: Partial<GridCardsChart>) => onChange({ ...chart, ...p });
  const updateCard = (i: number, p: Partial<GridCard>) => {
    const cards = [...chart.cards]; cards[i] = { ...cards[i], ...p }; u({ cards });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Label</label>
        <input type="text" value={chart.label} onChange={e => u({ label: e.target.value })} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Columns</label>
          <select value={chart.columns} onChange={e => u({ columns: Number(e.target.value) as 1 | 2 | 3 })} className={inputCls}>
            <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Card Style</label>
          <select value={chart.cardStyle ?? 'dark'} onChange={e => u({ cardStyle: e.target.value as 'dark' | 'colored' })} className={inputCls}>
            <option value="dark">dark</option><option value="colored">colored</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Cards</label>
          <button onClick={() => u({ cards: [...chart.cards, { ...BLANK_CARD }] })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add Card</button>
        </div>
        <div className="space-y-2">
          {chart.cards.map((card, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-2 space-y-1.5">
              <div className="flex justify-between"><p className="text-[10px] text-neutral-600">Card {i + 1}</p><button onClick={() => u({ cards: chart.cards.filter((_, j) => j !== i) })} className="text-neutral-700 hover:text-red-400 text-xs transition-colors">✕</button></div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={card.value} onChange={e => updateCard(i, { value: e.target.value })} placeholder="Value" className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500 w-full" />
                <select value={card.accentColor} onChange={e => updateCard(i, { accentColor: e.target.value as AccentColor })} className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-400 focus:outline-none focus:border-neutral-500 w-full">{ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}</select>
              </div>
              <input type="text" value={card.description} onChange={e => updateCard(i, { description: e.target.value })} placeholder="Description" className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Info Box (optional)</label>
          {!chart.infoBox
            ? <button onClick={() => u({ infoBox: { title: '', bullets: [] } })} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">+ Add</button>
            : <button onClick={() => u({ infoBox: undefined })} className="text-[10px] text-neutral-700 hover:text-red-400 transition-colors">Remove</button>
          }
        </div>
        {chart.infoBox && (
          <div className="border border-neutral-800 rounded-lg p-2.5 space-y-2">
            <input type="text" value={chart.infoBox.title} onChange={e => u({ infoBox: { ...chart.infoBox!, title: e.target.value } })} placeholder="Title" className={inputCls} />
            <div className="space-y-1">
              {(chart.infoBox.bullets ?? []).map((b, i) => (
                <div key={i} className="flex gap-1.5">
                  <input type="text" value={b} onChange={e => { const bullets = [...(chart.infoBox?.bullets ?? [])]; bullets[i] = e.target.value; u({ infoBox: { ...chart.infoBox!, bullets } }); }} className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500" />
                  <button onClick={() => u({ infoBox: { ...chart.infoBox!, bullets: (chart.infoBox?.bullets ?? []).filter((_, j) => j !== i) } })} className="text-neutral-700 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
                </div>
              ))}
              <button onClick={() => u({ infoBox: { ...chart.infoBox!, bullets: [...(chart.infoBox?.bullets ?? []), ''] } })} className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">+ Bullet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
