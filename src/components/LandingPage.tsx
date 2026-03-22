import { useState, useEffect, useRef } from 'react';
import { Map, ChevronDown, Phone, Search, Home, GitBranch, Scale } from 'lucide-react';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

// ─── Active-step tracker (IntersectionObserver) ───────────────────────────────
function useActiveStep(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, count);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );
    stepRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [count]);
  return { activeIndex, stepRefs };
}

// ─── ScrollySection ───────────────────────────────────────────────────────────
interface ScrollStep {
  id: string;
  visual: React.ReactNode;
  content: React.ReactNode;
}

function ScrollySection({ steps }: { steps: ScrollStep[] }) {
  const { activeIndex, stepRefs } = useActiveStep(steps.length);
  return (
    <div className="relative max-w-6xl mx-auto px-6">
      <div className="flex gap-16">
        {/* Sticky visual panel */}
        <div className="hidden md:flex w-1/2 sticky top-0 h-screen items-center justify-center py-10">
          <div className="relative w-full h-full max-h-[580px] rounded-3xl bg-neutral-800/80 border border-neutral-700/60 overflow-hidden flex items-center justify-center shadow-2xl">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 p-10 ${
                  i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {step.visual}
              </div>
            ))}
          </div>
        </div>
        {/* Scrolling steps */}
        <div className="w-full md:w-1/2 py-[20vh] space-y-[35vh]">
          {steps.map((step, i) => (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[i] = el; }}
              className={`transition-all duration-500 ${
                i === activeIndex ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-2'
              }`}
            >
              {step.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Act section header ───────────────────────────────────────────────────────
function ActLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-red-500">{icon}</span>
      <span className="text-red-400 text-xs uppercase tracking-widest font-bold">{label}</span>
    </div>
  );
}

// ─── Stat card (for outcomes grid) ───────────────────────────────────────────
function StatCard({ stat, label }: { stat: string; label: string }) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-700/80 flex flex-col gap-2">
      <div className="text-3xl font-black text-red-400 leading-none">{stat}</div>
      <div className="text-neutral-400 text-xs leading-snug">{label}</div>
    </div>
  );
}

// ─── Visual components ────────────────────────────────────────────────────────

function BarChartVisual() {
  return (
    <div className="w-full flex flex-col gap-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">SCR Call Acceptance Rate</p>
      <div className="flex items-end justify-center gap-12 h-56">
        <div className="flex flex-col items-center gap-3">
          <span className="text-red-400 font-black text-3xl">75%</span>
          <div className="w-28 bg-red-500 rounded-t-xl" style={{ height: '180px' }} />
          <span className="text-neutral-200 text-sm font-semibold">New York</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-neutral-300 font-black text-3xl">50%</span>
          <div className="w-28 bg-neutral-600 rounded-t-xl" style={{ height: '120px' }} />
          <span className="text-neutral-400 text-sm">National Avg.</span>
        </div>
      </div>
      <p className="text-center text-neutral-300 text-sm font-medium">
        New York passes 3 in 4 calls.<br />
        <span className="text-neutral-500">Most states pass 1 in 2.</span>
      </p>
    </div>
  );
}

function AnonymousTipsVisual() {
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">Substantiation Rate Comparison</p>
      <div className="flex gap-4">
        {/* Anonymous tips card */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-neutral-700/80">
          <div className="bg-neutral-700/50 px-4 py-2 text-center">
            <span className="text-neutral-300 text-xs font-semibold uppercase tracking-wider">Anonymous Tips</span>
          </div>
          <div className="bg-neutral-900 p-5 text-center space-y-2">
            <div className="text-neutral-400 text-sm">1 in 24 cases</div>
            <div className="text-6xl font-black text-neutral-400 leading-none mt-2">6.7%</div>
            <div className="text-xs text-neutral-500 mt-1">substantiated</div>
          </div>
        </div>
        {/* All cases card */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-red-800/60">
          <div className="bg-red-900/40 px-4 py-2 text-center">
            <span className="text-red-300 text-xs font-semibold uppercase tracking-wider">All Cases</span>
          </div>
          <div className="bg-neutral-900 p-5 text-center space-y-2">
            <div className="text-neutral-400 text-sm">&nbsp;</div>
            <div className="text-6xl font-black text-red-400 leading-none mt-2">22.5%</div>
            <div className="text-xs text-neutral-500 mt-1">substantiated</div>
          </div>
        </div>
      </div>
      <p className="text-center text-neutral-300 text-sm font-medium">
        Both families receive an investigator at the door.
      </p>
    </div>
  );
}

function CaseVolLineVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">ACS Case Volume, 2004–2023</p>
      <svg viewBox="0 0 300 160" className="w-full">
        <defs>
          <linearGradient id="redFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20" y1="140" x2="290" y2="140" stroke="#374151" strokeWidth="1" />
        {/* Area fill */}
        <polygon
          points="20,40 55,37 90,33 120,31 150,90 168,108 188,80 220,62 255,56 280,54 290,53 290,140 20,140"
          fill="url(#redFade)"
        />
        {/* Main volume line */}
        <polyline
          points="20,40 55,37 90,33 120,31 150,90 168,108 188,80 220,62 255,56 280,54 290,53"
          fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* CARES growth line */}
        <polyline
          points="20,138 80,135 120,130 150,120 188,105 240,85 280,70 290,65"
          fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3"
        />
        {/* COVID shading */}
        <rect x="148" y="10" width="42" height="130" fill="rgba(255,255,255,0.04)" rx="2" />
        <text x="169" y="22" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="600">COVID</text>
        {/* Axes labels */}
        <text x="20" y="155" fill="#6b7280" fontSize="8">2004</text>
        <text x="270" y="155" fill="#6b7280" fontSize="8">2023</text>
        {/* Legend */}
        <line x1="20" y1="10" x2="36" y2="10" stroke="#ef4444" strokeWidth="2.5" />
        <text x="40" y="14" fill="#d1d5db" fontSize="8">ACS Cases</text>
        <line x1="110" y1="10" x2="126" y2="10" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" />
        <text x="130" y="14" fill="#d1d5db" fontSize="8">CARES share</text>
      </svg>
      <p className="text-center text-neutral-400 text-xs italic px-4 leading-relaxed">
        Cases fell when children were home and out of sight of mandated reporters.<br />They rose again when schools reopened.
      </p>
    </div>
  );
}

function WarrantBoxVisual() {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">ACS Home Entries Per Year</p>
      {/* Proportional area visual */}
      <div className="relative w-full rounded-2xl border-2 border-neutral-500/70 bg-neutral-900/50" style={{ aspectRatio: '2' }}>
        {/* Large box label */}
        <div className="absolute top-3 left-4">
          <div className="text-neutral-200 text-lg font-black">~56,400</div>
          <div className="text-neutral-500 text-xs">ACS home entries</div>
        </div>
        {/* Tiny red warrant box */}
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
          <div className="bg-red-500 rounded" style={{ width: '14px', height: '14px' }} />
          <div className="text-red-400 text-xs font-bold text-right">94 warrants</div>
        </div>
        {/* Callout line */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <line x1="85%" y1="72%" x2="74%" y2="68%" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
        </svg>
      </div>
      <div className="w-full flex justify-between items-center px-1">
        <span className="flex items-center gap-2 text-sm text-neutral-400">
          <span className="w-5 h-5 border-2 border-neutral-500 rounded inline-block shrink-0" /> All home entries
        </span>
        <span className="flex items-center gap-2 text-sm text-red-400 font-semibold">
          <span className="w-3.5 h-3.5 bg-red-500 rounded-sm inline-block shrink-0" /> With a warrant
        </span>
      </div>
      <div className="text-center">
        <span className="text-neutral-400 text-sm">Warrant rate: </span>
        <span className="text-red-400 font-black text-xl">&lt;0.2%</span>
      </div>
    </div>
  );
}

function RaceRatesVisual() {
  const bars = [
    { label: 'Black children', pct: 44, color: 'bg-red-500', textColor: 'text-red-400' },
    { label: 'Latino children', pct: 43, color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'White children', pct: 19, color: 'bg-neutral-500', textColor: 'text-neutral-300' },
  ];
  return (
    <div className="w-full space-y-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">% of Children Investigated by ACS, 2021</p>
      {bars.map(({ label, pct, color, textColor }) => (
        <div key={label} className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-neutral-200 text-sm font-medium">{label}</span>
            <span className={`font-black text-2xl ${textColor}`}>{pct}%</span>
          </div>
          <div className="h-4 bg-neutral-700/60 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
      <div className="pt-2 border-t border-neutral-700/60">
        <p className="text-neutral-300 text-sm font-semibold text-center">
          A Black child in NYC has nearly a <span className="text-red-400">50% chance</span> of being investigated by age 18.
        </p>
      </div>
    </div>
  );
}

function DragnetVisual() {
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">FY 2023 — What Follows a Report</p>
      <div className="space-y-4">
        {[
          { label: 'Black & Latino families', indicated: 18, unsub: 82 },
          { label: 'White families', indicated: 24, unsub: 76 },
          { label: 'All families', indicated: 23, unsub: 77 },
        ].map(({ label, indicated, unsub }) => (
          <div key={label} className="space-y-1.5">
            <div className="text-neutral-300 text-sm font-medium">{label}</div>
            <div className="flex h-8 rounded-lg overflow-hidden text-xs font-bold">
              <div className="bg-red-600 flex items-center justify-center text-white shrink-0" style={{ width: `${indicated}%` }}>
                {indicated}%
              </div>
              <div className="bg-neutral-700 flex items-center justify-center text-neutral-300 flex-1">
                {unsub}% unsubstantiated
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-6 text-xs text-neutral-400 pt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> Indicated (substantiated)</span>
      </div>
    </div>
  );
}

function CostVisual() {
  return (
    <div className="w-full text-center space-y-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest">Annual Cost Comparison</p>
      {/* Separation cost */}
      <div className="rounded-2xl border border-red-800/60 bg-red-950/20 p-6">
        <div className="text-neutral-400 text-xs uppercase tracking-wider mb-2">To separate a child from their family</div>
        <div className="text-6xl font-black text-red-400 tabular-nums">$107,200</div>
        <div className="text-neutral-400 text-sm mt-1">per child · per year · 2024</div>
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-700" />
        <span className="text-neutral-600 text-sm font-bold uppercase tracking-wider">vs.</span>
        <div className="flex-1 h-px bg-neutral-700" />
      </div>
      {/* Stability cost */}
      <div className="rounded-2xl border border-neutral-700/60 bg-neutral-800/40 p-6">
        <div className="text-neutral-400 text-xs uppercase tracking-wider mb-2">To keep Eline's family together</div>
        <div className="text-5xl font-black text-neutral-300 tabular-nums">$3,600</div>
        <div className="text-neutral-500 text-sm mt-1">per year ($300/month housing subsidy)</div>
      </div>
      <p className="text-neutral-400 text-sm font-semibold">The system chose separation.</p>
    </div>
  );
}

function OutcomesVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">Long-Term Outcomes for Foster Youth</p>
      <div className="grid grid-cols-2 gap-3">
        <StatCard stat="28%" label="of homeless adults spent time in foster care" />
        <StatCard stat="20%" label="of prison inmates under 30 have a foster care history" />
        <StatCard stat="2×" label="higher teen birth rate for girls placed in foster care" />
        <StatCard stat="−15pp" label="employment reduction in young adulthood" />
      </div>
    </div>
  );
}

function MarginalCasesVisual() {
  return (
    <div className="w-full text-center space-y-6 px-2">
      <p className="text-neutral-300 text-base font-semibold leading-relaxed">
        For marginal cases, foster care placement can result in an arrest rate up to
      </p>
      <div className="text-[7rem] font-black text-red-400 leading-none">3×</div>
      <p className="text-neutral-300 text-lg font-semibold">
        higher than if the child had simply stayed home.
      </p>
      <div className="w-12 h-px bg-red-800 mx-auto" />
      <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
        Researchers controlling for pre-existing conditions still find that placement itself causes harm.
      </p>
    </div>
  );
}

function PlacementInstabilityVisual() {
  return (
    <div className="w-full space-y-7 text-center">
      <p className="text-neutral-400 text-xs uppercase tracking-widest">Placement Disruptions in Foster Care</p>
      {/* 4 person icons, 1 highlighted */}
      <div className="flex justify-center gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-2 ${i === 3 ? 'opacity-100' : 'opacity-20'}`}>
            <svg viewBox="0 0 24 40" className={`w-12 h-16`} fill={i === 3 ? '#f87171' : '#9ca3af'}>
              <circle cx="12" cy="8" r="6" />
              <path d="M2 40c0-10 20-10 20 0" />
            </svg>
            {i === 3 && <span className="text-red-400 text-xs font-bold">3+ moves</span>}
          </div>
        ))}
      </div>
      <p className="text-neutral-100 font-bold text-base px-2">
        1 in 4 foster children experiences 3 or more placement disruptions.
      </p>
      <div className="border-t border-neutral-700 pt-5 space-y-3">
        <div className="flex justify-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-3xl font-black text-neutral-200">40,000</div>
            <div className="text-neutral-500 text-xs mt-0.5">children in care (1999)</div>
          </div>
          <div className="flex items-center text-neutral-600 text-lg">→</div>
          <div className="text-center">
            <div className="text-3xl font-black text-neutral-400">&lt;7,000</div>
            <div className="text-neutral-500 text-xs mt-0.5">children in care (2024)</div>
          </div>
        </div>
        <p className="text-neutral-400 text-xs italic">Progress in volume. No change in logic.</p>
      </div>
    </div>
  );
}

function PipelineVisual() {
  const stages = [
    { label: 'SCR Hotline Calls',      pct: 100, color: '#6b7280', note: '95,590' },
    { label: 'Passed to Agencies',     pct: 75,  color: '#9ca3af', note: '75%' },
    { label: 'Formal Investigation',   pct: 53,  color: '#b45309', note: '~53%' },
    { label: 'CARES Track',            pct: 22,  color: '#d97706', note: '22%' },
    { label: 'Substantiated (Indicated)', pct: 17, color: '#dc2626', note: '~17%' },
    { label: 'Children Removed',       pct: 8,   color: '#7f1d1d', note: '~8%' },
  ];
  return (
    <div className="w-full space-y-3">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">From Call to Removal</p>
      {stages.map(({ label, pct, color, note }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-14 text-right text-xs text-neutral-400 shrink-0 font-mono">{note}</div>
          <div
            className="h-8 rounded-lg flex items-center px-3 text-xs text-white font-semibold truncate shrink-0"
            style={{ width: `calc(${pct}% - 3.5rem)`, backgroundColor: color, minWidth: '3rem' }}
          >
            {pct >= 30 ? label : ''}
          </div>
          {pct < 30 && <span className="text-neutral-400 text-xs shrink-0">{label}</span>}
        </div>
      ))}
    </div>
  );
}

function CARESTrendVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">CARES Share of ACS Cases</p>
      <svg viewBox="0 0 300 130" className="w-full">
        <defs>
          <linearGradient id="amberFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20" y1="115" x2="285" y2="115" stroke="#374151" strokeWidth="1" />
        {/* area fill */}
        <polygon
          points="20,112 70,109 120,102 170,88 215,70 260,52 285,46 285,115 20,115"
          fill="url(#amberFade)"
        />
        {/* trend line */}
        <polyline
          points="20,112 70,109 120,102 170,88 215,70 260,52 285,46"
          fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* start dot */}
        <circle cx="20" cy="112" r="4" fill="#f59e0b" />
        {/* end dot */}
        <circle cx="285" cy="46" r="5" fill="#f59e0b" />
        {/* labels */}
        <text x="20" y="128" fill="#9ca3af" fontSize="9">2016</text>
        <text x="258" y="128" fill="#9ca3af" fontSize="9">2024</text>
        <text x="5" y="114" fill="#9ca3af" fontSize="9" textAnchor="end">4%</text>
        <text x="288" y="44" fill="#f59e0b" fontSize="10" fontWeight="bold">22%</text>
      </svg>
      <p className="text-center text-neutral-300 text-sm font-semibold italic">
        Reform in name. The pipeline remains.
      </p>
    </div>
  );
}

function GeographyVisual() {
  const districts = [
    {
      name: 'Highbridge / Concourse',
      borough: 'South Bronx',
      code: 'District BX04',
      intakes: 1462,
      filings: 149,
      income: '$28K',
      hi: true,
    },
    {
      name: 'Park Slope',
      borough: 'Brooklyn',
      code: 'District BK06',
      intakes: 333,
      filings: 14,
      income: '$112K',
      hi: false,
    },
  ];
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">FY 2023 — Geography of Intervention</p>
      <div className="flex gap-3">
        {districts.map(({ name, borough, code, intakes, filings, income, hi }) => (
          <div
            key={code}
            className={`flex-1 rounded-2xl overflow-hidden border ${
              hi ? 'border-red-700/70' : 'border-neutral-700/70'
            }`}
          >
            {/* Card header */}
            <div className={`px-4 py-3 ${hi ? 'bg-red-950/60' : 'bg-neutral-800/60'}`}>
              <div className={`font-black text-lg leading-tight ${hi ? 'text-red-300' : 'text-neutral-200'}`}>
                {name}
              </div>
              <div className="text-neutral-500 text-xs">{borough}</div>
              <div className="text-neutral-600 text-xs mt-0.5">{code}</div>
            </div>
            {/* Card body */}
            <div className="bg-neutral-900/60 px-4 py-3 space-y-2.5">
              {[
                ['SCR Intakes', intakes.toLocaleString()],
                ['Article X Filings', filings],
                ['Median Household Income', income],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-baseline">
                  <span className="text-neutral-500 text-xs leading-tight max-w-[55%]">{k}</span>
                  <span className={`font-black text-base ${hi ? 'text-red-300' : 'text-neutral-300'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-neutral-400 text-sm text-center font-medium">Same system. Opposite outcomes.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage({ onStart }: { onStart: () => void }) {
  const counterRef = useRef<HTMLElement>(null);
  const [counterActive, setCounterActive] = useState(false);

  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCounterActive(true); },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const intakeCount = useCounter(95590, 2500, counterActive);
  const substantiatedCount = useCounter(22120, 3200, counterActive);

  // ── Step data ─────────────────────────────────────────────────────────────

  const act1Steps: ScrollStep[] = [
    {
      id: 'scr-rate',
      visual: <BarChartVisual />,
      content: (
        <div className="space-y-4">
          <ActLabel icon={<Phone size={14} />} label="Act 1 — The Phone Call" />
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">The SCR Intake</h2>
          <p className="text-neutral-300 leading-relaxed">
            New York's Statewide Central Register (SCR) accepts <strong className="text-white">75% of all calls</strong> alleging child maltreatment and routes them to local agencies for investigation — compared to the <strong className="text-white">50% national average</strong>.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Before a single investigator knocks on a door, New York has already decided that three out of four accusations are worth pursuing. There is no standardized screening tool. The state has never formally examined its own screen-out data.
          </p>
        </div>
      ),
    },
    {
      id: 'anonymous-tips',
      visual: <AnonymousTipsVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            One in 24 cases originates from an anonymous tip. Only <strong className="text-white">6.7%</strong> of those tips are ever substantiated — compared to <strong className="text-white">22.5%</strong> for all cases.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Yet the family on the other end of that anonymous call will receive an investigator at their door regardless. Despite years of reform rhetoric, the acceptance rate has barely moved.
          </p>
        </div>
      ),
    },
    {
      id: 'covid-dip',
      visual: <CaseVolLineVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-400 leading-relaxed">
            During COVID-19, case volume dropped sharply. When schools reopened, it rose again. This raises an uncomfortable question: did fewer children need protection — or were fewer families being watched?
          </p>
          <p className="text-neutral-300 leading-relaxed">
            Meanwhile, CARES — a nominally non-investigatory track — grew from <strong className="text-white">4% to 22%</strong> of cases routed. Reform has been incremental. The structural problems at the SCR remain unchanged.
          </p>
        </div>
      ),
    },
  ];

  const act2Steps: ScrollStep[] = [
    {
      id: 'warrant-box',
      visual: <WarrantBoxVisual />,
      content: (
        <div className="space-y-4">
          <ActLabel icon={<Search size={14} />} label="Act 2 — The Knock at the Door" />
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">The Investigation</h2>
          <p className="text-neutral-300 leading-relaxed">
            An ACS investigator arrives. They do not need a warrant. Between 2010 and 2020, ACS obtained an average of only <strong className="text-white">94 entry orders per year</strong> — out of approximately <strong className="text-white">56,400 cases annually</strong>. A warrant rate of less than 0.2%.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Instead, investigators gain entry through coercion: 3 a.m. visits, threats of immediate removal, public scenes in hallways to shame parents into compliance. Some caseworkers frame seeking a court order as "a warrant being put out on you."
          </p>
        </div>
      ),
    },
    {
      id: 'race-rates',
      visual: <RaceRatesVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            In 2021, <strong className="text-white">44% of Black children</strong> and <strong className="text-white">43% of Latino children</strong> in New York City experienced an ACS investigation. 19% of white children did.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            In 2023, <strong className="text-white">9.9% of reports against Black parents</strong> resulted in emergency removal — more than double the <strong className="text-neutral-400">4.4% rate for white parents</strong>.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Inside, investigators rifle through bedrooms, open medicine cabinets, inspect refrigerators, and strip-search children.
          </p>
        </div>
      ),
    },
    {
      id: 'dragnet',
      visual: <DragnetVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            The psychological toll is severe and documented. Children blame themselves.
          </p>
          <blockquote className="border-l-2 border-red-500 pl-4 italic text-neutral-300 leading-relaxed">
            A young girl, asked to write a story about the home visits, wrote: "I am a bad kid." A six-year-old began repeating the word "suicidal" during every subsequent visit — associating the presence of the state with self-harm.
          </blockquote>
          <p className="text-neutral-400 leading-relaxed">
            In FY 2023, <strong className="text-white">56.6% of all intakes were unsubstantiated</strong>. The system is a high-volume, low-yield dragnet.
          </p>
        </div>
      ),
    },
  ];

  const act3Steps: ScrollStep[] = [
    {
      id: 'cost',
      visual: <CostVisual />,
      content: (
        <div className="space-y-4">
          <ActLabel icon={<Home size={14} />} label='Act 3 — The Cost of "Help"' />
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">Foster Care</h2>
          <p className="text-neutral-300 leading-relaxed">
            In 2024, ACS maintained an average of <strong className="text-white">6,400 children in foster care</strong> at a total cost of <strong className="text-white">$685,963,000</strong> — roughly $107,200 per child per year.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Consider Eline in the Bronx. Her children were removed for three years because her apartment had a rat infestation. The city paid foster families more than $1,000 per month. The city refused to provide Eline with a $300 monthly housing subsidy — <strong className="text-white">$3,600 per year</strong> — that could have kept her family together.
          </p>
          <p className="text-neutral-300 font-medium leading-relaxed">
            The system is not designed to help families. It is designed to pay for their separation.
          </p>
        </div>
      ),
    },
    {
      id: 'outcomes',
      visual: <OutcomesVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            What does the state's $107,200 actually buy?
          </p>
          <p className="text-neutral-400 leading-relaxed">
            An estimated <strong className="text-white">28% of the homeless population</strong> spent time in foster care. Nearly <strong className="text-white">20% of prison inmates under 30</strong> report a foster care history. Girls placed in foster care have a teen birth rate roughly <strong className="text-white">twice</strong> that of girls who remained home.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            These are not the outcomes of a system that protects children. They are the outcomes of a system that trades one form of harm for another.
          </p>
        </div>
      ),
    },
    {
      id: 'marginal',
      visual: <MarginalCasesVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            The most damning evidence concerns "marginal cases" — families where the evidence is ambiguous, where a caseworker could plausibly decide either way.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            These are precisely the cases most likely to be produced by the dragnet described above: the anonymous tips with a 6.7% substantiation rate, the poverty-coded neglect allegations.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            For these families, research finds that children left at home have <strong className="text-white">lower adult arrest, conviction, and imprisonment rates</strong> than those removed. The system is not removing the children who most need protection. It is removing the children least likely to need it.
          </p>
        </div>
      ),
    },
    {
      id: 'placement',
      visual: <PlacementInstabilityVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-400 leading-relaxed">
            A quarter of foster children experience three or more placement disruptions — moved from home to home, with each move severing whatever fragile attachments they have managed to form.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            On average, removed children spend <strong className="text-white">48% of the observation period out of home</strong>. They are not in one stable place. They are cycling through a system that cannot decide what to do with them.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The number of children in foster care has fallen from 40,000 in 1999 to under 7,000 today. That decline represents real progress. But the system's underlying logic has not changed.
          </p>
        </div>
      ),
    },
  ];

  const act4Steps: ScrollStep[] = [
    {
      id: 'cares-pipeline',
      visual: <PipelineVisual />,
      content: (
        <div className="space-y-4">
          <ActLabel icon={<GitBranch size={14} />} label="Act 4 — The Alternative That Isn't" />
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">CARES</h2>
          <p className="text-neutral-300 leading-relaxed">
            In 2024, New York City announced a milestone: <strong className="text-white">25% of incoming child protection cases</strong> are now diverted to CARES — the Collaborative Assessment, Response, Engagement, and Support program — framed as a non-investigatory, family-supportive alternative.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            But the case of Dayanara tells a different story. Placed in the CARES track, she had her child removed by an ACS worker who interpreted her speech pattern as evidence of drug use — without a drug test, without court involvement, without informing her of her rights. Judicial approval was not sought until <strong className="text-white">six days after</strong> the child had already been removed.
          </p>
        </div>
      ),
    },
    {
      id: 'cares-reform',
      visual: <CARESTrendVisual />,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-400 leading-relaxed">
            CARES is technically voluntary. But if a family is deemed "resistant," the agency can switch the case to a formal investigation. The program operates under the same coercive umbrella as the system it is meant to replace.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The growth of CARES — from <strong className="text-white">4% to 22%</strong> of cases routed — looks like reform. But if the pipeline at the SCR remains unreformed, the label changes while the machine does not.
          </p>
          <blockquote className="border-l-2 border-amber-500 pl-4 italic text-neutral-400 leading-relaxed text-sm">
            CARES may function as "another surveillance program." — The Bronx Defenders, <em>This Wound Is Still Fresh</em>
          </blockquote>
        </div>
      ),
    },
  ];

  const act5Steps: ScrollStep[] = [
    {
      id: 'geography',
      visual: <GeographyVisual />,
      content: (
        <div className="space-y-4">
          <ActLabel icon={<Scale size={14} />} label="Act 5 — The Courthouse" />
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">Court-Ordered Supervision</h2>
          <p className="text-neutral-300 leading-relaxed">
            For families that reach Family Court, the state formalizes its grip through Article X filings — neglect petitions that overwhelmingly conflate poverty with parental failure. The geography of these filings is not random. It is a map of structural disinvestment.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            A parent in Park Slope can address a mental health crisis privately, with their own resources. A parent in the South Bronx faces a state-mandated legal battle.
          </p>
        </div>
      ),
    },
    {
      id: 'marianna',
      visual: (
        <div className="w-full text-center space-y-5 px-4">
          <div className="text-[7rem] font-black text-neutral-700 leading-none">2</div>
          <div className="text-neutral-300 text-2xl font-bold">nights in pain</div>
          <div className="w-12 h-px bg-neutral-600 mx-auto" />
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
            Marianna Azar refused opioid painkillers after abdominal surgery — not because of addiction, but because she feared ACS would interpret medication on her bedside table as evidence of substance abuse.
          </p>
          <p className="text-neutral-500 text-xs italic">A direct and documented consequence of state-induced fear.</p>
        </div>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-neutral-300 leading-relaxed">
            The terror of this process is not abstract.
          </p>
          <blockquote className="border-l-2 border-red-500 pl-4 text-neutral-300 leading-relaxed">
            Marianna Azar, recovering from abdominal surgery, refused opioid painkillers — not because of addiction, but because she feared ACS would interpret the medication on her bedside table as evidence of "substance abuse." She spent two nights in excruciating pain.
          </blockquote>
          <p className="text-neutral-400 text-sm">A direct and documented consequence of state-induced fear.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-neutral-900 text-neutral-100 font-sans selection:bg-red-500 selection:text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-red-400 font-bold tracking-widest uppercase text-sm">
            The Bronx Defenders × PiTech
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-tight">
            The Family<br />Policing Machine
          </h1>
          <p className="text-neutral-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            You enter thinking you're learning about child protection.<br />
            You'll exit understanding you've witnessed a surveillance system aimed at Black and Latino families in poverty.
          </p>
          <div className="mt-16 flex flex-col items-center gap-2 text-neutral-500 text-sm animate-bounce">
            <span>Scroll to begin</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ── Opening Counter ────────────────────────────────────────────────── */}
      <section
        ref={counterRef}
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center border-t border-neutral-800"
      >
        <div className="max-w-3xl w-full space-y-14">
          <p className="text-neutral-500 text-sm uppercase tracking-widest">New York City, 2023</p>
          <div className="space-y-3">
            <div className="text-7xl md:text-9xl font-black tabular-nums text-white">
              {intakeCount.toLocaleString()}
            </div>
            <p className="text-neutral-300 text-lg">calls to the Statewide Central Register (SCR)</p>
          </div>
          <div className="w-px h-14 bg-neutral-700 mx-auto" />
          <div className="space-y-3">
            <div className="text-5xl md:text-7xl font-black tabular-nums text-neutral-400">
              {substantiatedCount.toLocaleString()}
            </div>
            <p className="text-neutral-400 text-lg">
              ever substantiated <span className="text-neutral-500">(23.1%)</span>
            </p>
          </div>
          <p className="text-neutral-300 text-lg font-semibold max-w-xl mx-auto leading-relaxed">
            Every year, a phone call sets a machine in motion. That call can end with children taken from their parents, families destroyed, and communities surveilled.
          </p>
          <p className="text-neutral-200 font-bold text-xl">
            This is not the child protection system.<br />
            <span className="text-red-400">This is family policing.</span>
          </p>
          <p className="text-neutral-500 text-sm">And in the Bronx, it is inescapable.</p>
        </div>
      </section>

      {/* ── Act 1 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act1Steps} />
      </div>

      {/* ── Pull quotes ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto space-y-10">
          {[
            '"I\'m not going to stop coming."',
            '"Why not, if you don\'t have anything to hide?"',
          ].map((q) => (
            <blockquote key={q} className="text-2xl md:text-3xl font-bold text-neutral-200 leading-relaxed border-l-4 border-red-500 pl-6">
              {q}
            </blockquote>
          ))}
          <p className="text-neutral-500 text-sm pl-6 italic">
            Documented investigator tactics reported by ACS-investigated families in the Bronx.
          </p>
        </div>
      </section>

      {/* ── Act 2 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act2Steps} />
      </div>

      {/* ── Marginal cases bridge ──────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-neutral-800 bg-neutral-800/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-2xl md:text-3xl font-extrabold leading-relaxed text-neutral-100">
            "The cases least likely to be substantiated are the cases where removal causes the most harm."
          </p>
          <div className="w-12 h-px bg-red-500 mx-auto" />
          <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
            The anonymous tips. The poverty-coded neglect allegations. The 56.6% that never substantiate but proceed anyway. These are the cases where the machine does its worst damage.
          </p>
        </div>
      </section>

      {/* ── Act 3 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act3Steps} />
      </div>

      {/* ── Act 4 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act4Steps} />
      </div>

      {/* ── Act 5 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act5Steps} />
      </div>

      {/* ── Closing ───────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-neutral-800 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight">
            The System Chooses This
          </h2>
          <p className="text-neutral-300 text-lg leading-relaxed">
            This is not a system failing to achieve its goals. It is a system achieving exactly what it was designed to achieve: the surveillance, investigation, and control of Black and Latino families in poverty, under the cover of child protection.
          </p>
          <div className="space-y-3 text-left max-w-xl mx-auto">
            {[
              'NY accepts calls at twice the national average',
              'Investigators enter homes without warrants 99.8% of the time',
              'Black children face emergency removal at more than double the rate of white children',
              'The state pays $107,200/year to separate — and refused $3,600/year to stabilize',
              'CARES removes children without court orders or parental notification of rights',
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <span className="text-red-400 mt-0.5 shrink-0">—</span>
                <span className="text-neutral-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-neutral-800 space-y-4">
            <p className="text-neutral-400 text-xs uppercase tracking-widest">What would actually help</p>
            <div className="space-y-3 text-left max-w-xl mx-auto">
              {[
                'A standardized SCR screening tool, as used by most other states',
                'Judicial oversight before — not six days after — child removal',
                'Housing subsidies, visiting nurses, food access as a first response',
                'Community-based pathways that carry no threat of investigation',
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                  <span className="text-neutral-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800">
            <p className="text-4xl md:text-6xl font-black text-neutral-400 leading-tight">
              23% were ever substantiated.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-neutral-300 mt-4 leading-tight">
              The other 77% were families<br />who had done nothing wrong.
            </p>
          </div>
        </div>
      </section>

      {/* ── Map entry ─────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center border-t border-neutral-800">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight">
            See Every Decision Point
          </h2>
          <p className="text-neutral-300 text-lg max-w-xl mx-auto leading-relaxed">
            Navigate the full ACS flowchart interactively — every path, every outcome, every moment a family's fate is decided.
          </p>
          <button
            onClick={onStart}
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-red-600 rounded-full transition-all hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50"
          >
            <span className="mr-2">Explore the System Map</span>
            <Map className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  );
}
