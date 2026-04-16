/**
 * PlacementInstability — bespoke visualisation for "group-home-placement-instability".
 * Shows silhouette figures, the last one highlighted in red.
 *
 * Data is passed via the `data` prop from statistics.json → ComponentChart.
 */

interface Metric {
  value: string;
  label: string;
}

interface PlacementInstabilityData {
  iconCount?: number;
  highlightIndex?: number;
  highlightLabel?: string;
  headline?: string;
  metrics?: Metric[];
  note?: string;
}

export default function PlacementInstability({ data }: { data: Record<string, unknown> }) {
  const d = data as PlacementInstabilityData;
  const iconCount      = d.iconCount      ?? 4;
  const highlightIndex = d.highlightIndex ?? 3;
  const highlightLabel = d.highlightLabel ?? '3+ moves';
  const headline       = d.headline       ?? '1 in 4 foster children experiences 3 or more placement disruptions.';
  const metrics        = (d.metrics as Metric[]) ?? [
    { value: '40,000', label: 'children in care (1999)' },
    { value: '<7,000', label: 'children in care (2024)' },
  ];
  const note = d.note as string | undefined;

  return (
    <div className="w-full space-y-7 text-center">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        Placement Disruptions in Foster Care
      </p>
      <div className="flex justify-center gap-5">
        {Array.from({ length: iconCount }).map((_, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-2 ${i === highlightIndex ? 'opacity-100' : 'opacity-20'}`}
          >
            <svg viewBox="0 0 24 40" className="w-12 h-16" fill={i === highlightIndex ? '#f87171' : '#9ca3af'}>
              <circle cx="12" cy="8" r="6" />
              <path d="M2 40c0-10 20-10 20 0" />
            </svg>
            {i === highlightIndex && (
              <span className="text-red-400 text-xs font-bold">{highlightLabel}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-neutral-100 font-bold text-base px-2">{headline}</p>
      <div className="border-t border-neutral-700 pt-5 space-y-3">
        <div className="flex justify-center items-center gap-8 text-sm">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-8">
              {i > 0 && <span className="text-neutral-600 text-lg">→</span>}
              <div className="text-center">
                <div className={`text-3xl font-black ${i === 0 ? 'text-neutral-200' : 'text-neutral-400'}`}>
                  {m.value}
                </div>
                <div className="text-neutral-500 text-xs mt-0.5">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
        {note && <p className="text-neutral-400 text-xs italic">{note}</p>}
      </div>
    </div>
  );
}
