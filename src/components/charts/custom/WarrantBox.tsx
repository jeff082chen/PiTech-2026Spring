/**
 * WarrantBox — bespoke visualisation for "safety-warrant-rate".
 * Shows total ACS home entries per year, with a tiny red square
 * in the corner representing the fraction that had a warrant (<0.2%).
 *
 * Data is passed via the `data` prop from statistics.json → ComponentChart.
 */

interface WarrantBoxData {
  label?: string;
  total?: string;
  totalLabel?: string;
  highlight?: string;
  warrantRate?: string;
}

export default function WarrantBox({ data }: { data: Record<string, unknown> }) {
  const d = data as WarrantBoxData;
  const label       = d.label       ?? 'ACS Home Entries Per Year';
  const total       = d.total       ?? '~56,400';
  const totalLabel  = d.totalLabel  ?? 'ACS home entries';
  const highlight   = d.highlight   ?? '94 warrants';
  const warrantRate = d.warrantRate ?? '<0.2%';

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {label}
      </p>
      <div
        className="relative w-full rounded-2xl border-2 border-neutral-500/70 bg-neutral-900/50"
        style={{ aspectRatio: '2' }}
      >
        <div className="absolute top-3 left-4">
          <div className="text-neutral-200 text-lg font-black">{total}</div>
          <div className="text-neutral-500 text-xs">{totalLabel}</div>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
          <div className="bg-red-500 rounded" style={{ width: '14px', height: '14px' }} />
          <div className="text-red-400 text-xs font-bold text-right">{highlight}</div>
        </div>
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <line
            x1="85%" y1="72%" x2="74%" y2="68%"
            stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"
          />
        </svg>
      </div>
      <div className="w-full flex justify-between items-center px-1">
        <span className="flex items-center gap-2 text-sm text-neutral-400">
          <span className="w-5 h-5 border-2 border-neutral-500 rounded inline-block shrink-0" />
          All home entries
        </span>
        <span className="flex items-center gap-2 text-sm text-red-400 font-semibold">
          <span className="w-3.5 h-3.5 bg-red-500 rounded-sm inline-block shrink-0" />
          With a warrant
        </span>
      </div>
      <div className="text-center">
        <span className="text-neutral-400 text-sm">Warrant rate: </span>
        <span className="text-red-400 font-black text-xl">{warrantRate}</span>
      </div>
    </div>
  );
}
