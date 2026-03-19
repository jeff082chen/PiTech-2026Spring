import { useState, useEffect, useRef } from 'react';
import { Map, ChevronDown } from 'lucide-react';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // ease-out quad
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

// ─── ScrollySection: sticky visual left, scrolling steps right ───────────────
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
        <div className="hidden md:flex w-1/2 sticky top-0 h-screen items-center justify-center py-12">
          <div className="relative w-full h-full max-h-[600px] rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 p-8 ${
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

// ─── Visual components ────────────────────────────────────────────────────────

function BarChartVisual() {
  return (
    <div className="w-full flex flex-col gap-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-2">SCR Acceptance Rate</p>
      <div className="flex items-end justify-center gap-10 h-52">
        <div className="flex flex-col items-center gap-2">
          <span className="text-red-500 font-black text-2xl">75%</span>
          <div className="w-24 bg-red-500 rounded-t-lg transition-all duration-1000" style={{ height: '168px' }} />
          <span className="text-neutral-300 text-sm font-medium">New York</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-neutral-400 font-black text-2xl">50%</span>
          <div className="w-24 bg-neutral-600 rounded-t-lg" style={{ height: '112px' }} />
          <span className="text-neutral-400 text-sm">National Avg.</span>
        </div>
      </div>
      <p className="text-center text-neutral-500 text-sm mt-2">
        New York passes 3 in 4 calls.<br />Most states pass 1 in 2.
      </p>
    </div>
  );
}

function AnonymousTipsVisual() {
  return (
    <div className="w-full space-y-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">Substantiation Rate</p>
      <div className="flex gap-4">
        <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center border border-neutral-700">
          <div className="text-neutral-400 text-xs mb-3">Anonymous tips</div>
          <div className="text-neutral-500 text-sm mb-1">1 in 24 cases</div>
          <div className="text-5xl font-black text-neutral-500 mt-3">6.7%</div>
          <div className="text-xs text-neutral-600 mt-1">substantiated</div>
        </div>
        <div className="flex-1 bg-neutral-900 rounded-xl p-5 text-center border border-red-900/60">
          <div className="text-neutral-400 text-xs mb-3">All cases</div>
          <div className="text-neutral-500 text-sm mb-1">&nbsp;</div>
          <div className="text-5xl font-black text-red-500 mt-3">22.5%</div>
          <div className="text-xs text-neutral-600 mt-1">substantiated</div>
        </div>
      </div>
      <p className="text-center text-neutral-500 text-sm">
        Both receive an investigator at the door.
      </p>
    </div>
  );
}

function CaseVolLineVisual() {
  return (
    <div className="w-full space-y-3">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">ACS Case Volume, 2004–2023</p>
      <svg viewBox="0 0 300 140" className="w-full">
        <line x1="0" y1="130" x2="300" y2="130" stroke="#374151" strokeWidth="1" />
        {/* Main volume line — high, COVID dip, recovery */}
        <polyline
          points="0,35 40,32 80,28 115,26 148,80 168,98 188,72 220,55 255,50 280,48 300,47"
          fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* CARES growth line */}
        <polyline
          points="0,128 60,126 100,122 148,108 188,92 240,70 280,58 300,55"
          fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3"
        />
        {/* COVID shading */}
        <rect x="146" y="0" width="44" height="130" fill="rgba(255,255,255,0.03)" />
        <text x="168" y="12" textAnchor="middle" fill="#4b5563" fontSize="7">COVID</text>
        {/* Labels */}
        <text x="0" y="145" fill="#6b7280" fontSize="7">2004</text>
        <text x="270" y="145" fill="#6b7280" fontSize="7">2023</text>
        <text x="290" y="46" fill="#ef4444" fontSize="7">Cases</text>
        <text x="290" y="56" fill="#f59e0b" fontSize="7">CARES</text>
      </svg>
      <p className="text-center text-neutral-500 text-xs italic px-2">
        "Cases fell when children were out of sight of mandated reporters. They rose again when schools reopened."
      </p>
    </div>
  );
}

function WarrantBoxVisual() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">ACS Cases vs. Warrants Obtained (per year)</p>
      {/* Proportional area: 56,400 cases, 94 warrants = 0.17% */}
      <div className="relative w-full border-2 border-neutral-500 rounded-lg" style={{ aspectRatio: '1.8' }}>
        <span className="absolute top-3 left-3 text-neutral-400 text-xs">~56,400 ACS Cases</span>
        {/* tiny box in corner, ~√0.0017 ≈ 4% of width */}
        <div
          className="absolute bottom-3 right-3 bg-red-500 rounded-sm"
          style={{ width: '4%', aspectRatio: '1' }}
          title="94 cases with a warrant"
        />
      </div>
      <div className="flex gap-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-neutral-500 rounded-sm inline-block" /> All cases
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> 94 warrants
        </span>
      </div>
      <p className="text-neutral-500 text-sm text-center">Warrant rate: <span className="text-red-400 font-bold">&lt;0.2%</span></p>
    </div>
  );
}

function RaceRatesVisual() {
  return (
    <div className="w-full space-y-5">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">Children Investigated by ACS, 2021</p>
      {[
        { label: 'Black children', pct: 44, color: 'bg-red-500' },
        { label: 'Latino children', pct: 43, color: 'bg-amber-500' },
        { label: 'White children', pct: 19, color: 'bg-neutral-500' },
      ].map(({ label, pct, color }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300">{label}</span>
            <span className="font-bold text-white">{pct}%</span>
          </div>
          <div className="h-3 bg-neutral-700 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
      <p className="text-neutral-500 text-xs text-center pt-2">
        A Black child in NYC has nearly a <span className="text-red-400 font-semibold">50% chance</span> of being investigated by age 18.
      </p>
    </div>
  );
}

function DragnetVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">FY 2023 — What Happens After a Report</p>
      <div className="space-y-3">
        {[
          { label: 'Black & Latino families', indicated: 18, unsub: 82 },
          { label: 'White families', indicated: 24, unsub: 76 },
          { label: 'All families', indicated: 23, unsub: 77 },
        ].map(({ label, indicated, unsub }) => (
          <div key={label} className="space-y-1">
            <div className="text-xs text-neutral-400">{label}</div>
            <div className="flex h-7 rounded overflow-hidden text-xs font-bold">
              <div className="bg-red-700 flex items-center justify-center text-white" style={{ width: `${indicated}%` }}>
                {indicated}%
              </div>
              <div className="bg-neutral-700 flex items-center justify-center text-neutral-500 flex-1">
                {unsub}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-neutral-500 pt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-700 inline-block" /> Indicated</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-neutral-700 inline-block" /> Unsubstantiated</span>
      </div>
    </div>
  );
}

function CostVisual() {
  return (
    <div className="w-full text-center space-y-8">
      <div>
        <div className="text-7xl font-black text-red-500 tabular-nums">$107,200</div>
        <div className="text-neutral-400 mt-2 text-sm">to separate a family<br />(per child, per year, 2024)</div>
      </div>
      <div className="w-12 h-px bg-neutral-700 mx-auto" />
      <div>
        <div className="text-4xl font-black text-neutral-500 tabular-nums">$300</div>
        <div className="text-neutral-600 mt-2 text-sm">monthly housing subsidy<br />that could have kept Eline's family together</div>
      </div>
      <p className="text-neutral-700 text-sm italic">The system chose separation.</p>
    </div>
  );
}

function OutcomesVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">Long-Term Outcomes for Foster Youth</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { stat: '28%', label: 'of homeless adults spent time in foster care' },
          { stat: '20%', label: 'of prison inmates under 30 have foster care history' },
          { stat: '2×', label: 'higher teen birth rate for girls placed in foster care' },
          { stat: '−15pp', label: 'employment reduction in young adulthood' },
        ].map(({ stat, label }) => (
          <div key={stat} className="bg-neutral-900 rounded-xl p-4 border border-neutral-700">
            <div className="text-3xl font-black text-red-500 mb-1">{stat}</div>
            <div className="text-neutral-500 text-xs leading-snug">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarginalCasesVisual() {
  return (
    <div className="w-full text-center space-y-6 px-2">
      <p className="text-neutral-300 text-lg font-bold leading-relaxed">
        For marginal cases, foster care placement can result in an arrest rate up to
      </p>
      <div className="text-8xl font-black text-red-500">3×</div>
      <p className="text-neutral-400 leading-relaxed">
        higher than if the child had simply stayed home.
      </p>
      <div className="w-12 h-px bg-neutral-700 mx-auto" />
      <p className="text-neutral-600 text-xs leading-relaxed max-w-xs mx-auto">
        Researchers specifically controlling for pre-existing conditions still find that placement itself causes harm.
      </p>
    </div>
  );
}

function PlacementInstabilityVisual() {
  return (
    <div className="w-full space-y-8 text-center">
      <p className="text-neutral-400 text-xs uppercase tracking-widest">Placement Disruptions</p>
      <div className="flex justify-center gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-2 transition-opacity ${i === 3 ? 'opacity-100' : 'opacity-25'}`}>
            <svg viewBox="0 0 24 36" className="w-10 h-14" fill={i === 3 ? '#ef4444' : '#9ca3af'}>
              <circle cx="12" cy="8" r="5" />
              <path d="M3 36c0-8 18-8 18 0" />
            </svg>
            {i === 3 && <span className="text-red-500 text-xs font-bold">3+ moves</span>}
          </div>
        ))}
      </div>
      <p className="text-neutral-200 font-semibold text-sm px-2">
        1 in 4 foster children experiences 3 or more placement disruptions.
      </p>
      <div className="border-t border-neutral-700 pt-4 space-y-1 text-xs text-neutral-500">
        <p>From <span className="text-neutral-300 font-bold">40,000</span> children in foster care in 1999</p>
        <p>to under <span className="text-neutral-300 font-bold">7,000</span> today</p>
        <p className="text-neutral-600 italic mt-2">Progress in volume. No change in logic.</p>
      </div>
    </div>
  );
}

function PipelineVisual() {
  const stages = [
    { label: 'SCR Hotline Calls', pct: 100, color: 'bg-neutral-600', note: '95,590' },
    { label: 'Passed to Agencies', pct: 75, color: 'bg-neutral-500', note: '75%' },
    { label: 'Formal Investigation', pct: 53, color: 'bg-amber-800', note: '~53%' },
    { label: 'CARES Track', pct: 22, color: 'bg-amber-500', note: '22%' },
    { label: 'Indicated Cases', pct: 17, color: 'bg-red-600', note: '23% of those' },
    { label: 'Children Removed', pct: 8, color: 'bg-red-900', note: '~8%' },
  ];
  return (
    <div className="w-full space-y-2">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">The ACS Pipeline</p>
      {stages.map(({ label, pct, color, note }) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-16 text-right text-xs text-neutral-500 shrink-0">{note}</div>
          <div
            className={`h-7 ${color} rounded flex items-center px-2 text-xs text-white/90 font-medium truncate`}
            style={{ width: `${pct}%` }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function CARESTrendVisual() {
  return (
    <div className="w-full space-y-3">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">CARES Share of ACS Cases</p>
      <svg viewBox="0 0 280 110" className="w-full">
        <line x1="0" y1="100" x2="280" y2="100" stroke="#374151" strokeWidth="1" />
        <polyline
          points="0,97 50,93 100,87 150,74 200,58 240,45 280,40"
          fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
        />
        <text x="0" y="115" fill="#6b7280" fontSize="7">2016</text>
        <text x="250" y="115" fill="#6b7280" fontSize="7">2024</text>
        <text x="2" y="97" fill="#6b7280" fontSize="7">4%</text>
        <text x="247" y="39" fill="#f59e0b" fontSize="7">22%</text>
      </svg>
      <p className="text-center text-neutral-500 text-sm italic">Reform in name. The pipeline remains.</p>
    </div>
  );
}

function GeographyVisual() {
  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center">FY 2023 — Geography of Intervention</p>
      <div className="flex gap-3">
        {[
          { district: 'BX04', name: 'Highbridge / Concourse, Bronx', intakes: 1462, filings: 149, income: '$28K', hi: true },
          { district: 'BK06', name: 'Park Slope, Brooklyn', intakes: 333, filings: 14, income: '$112K', hi: false },
        ].map(({ district, name, intakes, filings, income, hi }) => (
          <div
            key={district}
            className={`flex-1 bg-neutral-900 rounded-xl p-4 border ${hi ? 'border-red-700' : 'border-neutral-700'}`}
          >
            <div className={`text-xl font-black mb-0.5 ${hi ? 'text-red-400' : 'text-neutral-400'}`}>{district}</div>
            <div className="text-neutral-600 text-xs mb-4 leading-tight">{name}</div>
            <div className="space-y-2 text-sm">
              {[
                ['SCR Intakes', intakes.toLocaleString()],
                ['Article X Filings', filings],
                ['Median Income', income],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <span className="text-neutral-500 text-xs">{k}</span>
                  <span className={`font-bold ${hi ? 'text-red-300' : 'text-neutral-300'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-neutral-600 text-xs text-center">Identical system. Opposite outcomes.</p>
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

  // ── Step data ────────────────────────────────────────────────────────────────

  const act1Steps: ScrollStep[] = [
    {
      id: 'scr-rate',
      visual: <BarChartVisual />,
      content: (
        <div className="space-y-4">
          <div className="text-red-500 text-xs uppercase tracking-widest font-bold">Act 1 — The Phone Call</div>
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
          <div className="text-red-500 text-xs uppercase tracking-widest font-bold">Act 2 — The Knock at the Door</div>
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
          <div className="text-red-500 text-xs uppercase tracking-widest font-bold">Act 3 — The Cost of "Help"</div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">Foster Care</h2>
          <p className="text-neutral-300 leading-relaxed">
            In 2024, ACS maintained an average of <strong className="text-white">6,400 children in foster care</strong> at a total cost of <strong className="text-white">$685,963,000</strong> — roughly $107,200 per child per year.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Consider Eline in the Bronx. Her children were removed for three years because her apartment had a rat infestation. The city paid a foster family more than $1,000 per month to care for her children. The city refused to provide Eline with the $300 monthly housing subsidy that could have kept her family together.
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
            These are not the outcomes of a system that protects children. They are the outcomes of a system that trades one form of harm for another — and in many cases, manufactures harm where it did not previously exist.
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
          <div className="text-red-500 text-xs uppercase tracking-widest font-bold">Act 4 — The Alternative That Isn't</div>
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
          <div className="text-red-500 text-xs uppercase tracking-widest font-bold">Act 5 — The Courthouse</div>
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
        <div className="w-full text-center space-y-6 px-4">
          <div className="text-8xl font-black text-neutral-700">2</div>
          <div className="text-neutral-400 text-xl">nights in pain</div>
          <div className="w-12 h-px bg-neutral-700 mx-auto" />
          <p className="text-neutral-500 text-sm leading-relaxed">
            Marianna Azar refused opioid painkillers after abdominal surgery — not because of addiction, but because she feared ACS would interpret medication on her bedside table as evidence of substance abuse.
          </p>
          <p className="text-neutral-600 text-xs italic">A direct and documented consequence of state-induced fear.</p>
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
          <p className="text-neutral-500 text-sm">A direct and documented consequence of state-induced fear.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-neutral-900 text-neutral-100 font-sans selection:bg-red-500 selection:text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-red-500 font-bold tracking-widest uppercase text-sm">
            The Bronx Defenders × PiTech
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-tight">
            The Family<br />Policing Machine
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            You enter thinking you're learning about child protection.<br />
            You'll exit understanding you've witnessed a surveillance system aimed at Black and Latino families in poverty.
          </p>
          <p className="text-neutral-600 text-sm max-w-xl mx-auto italic">
            The emotional arc: confusion → recognition → outrage → call to action.
          </p>
          <div className="mt-16 flex flex-col items-center gap-2 text-neutral-600 text-sm animate-bounce">
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
        <div className="max-w-3xl w-full space-y-16">
          <p className="text-neutral-600 text-sm uppercase tracking-widest">New York City, 2023</p>
          <div className="space-y-3">
            <div className="text-7xl md:text-9xl font-black tabular-nums text-white">
              {intakeCount.toLocaleString()}
            </div>
            <p className="text-neutral-400 text-lg">calls to the Statewide Central Register</p>
          </div>
          <div className="w-px h-16 bg-neutral-800 mx-auto" />
          <div className="space-y-3">
            <div className="text-5xl md:text-7xl font-black tabular-nums text-neutral-600">
              {substantiatedCount.toLocaleString()}
            </div>
            <p className="text-neutral-500 text-lg">
              ever substantiated <span className="text-neutral-700">(23.1%)</span>
            </p>
          </div>
          <p className="text-neutral-400 text-lg font-semibold max-w-xl mx-auto leading-relaxed">
            Every year, a phone call sets a machine in motion. That call can end with children taken from their parents, families destroyed, and communities surveilled.
          </p>
          <p className="text-neutral-300 font-bold text-xl">
            This is not the child protection system.<br />
            <span className="text-red-500">This is family policing.</span>
          </p>
          <p className="text-neutral-600 text-sm">And in the Bronx, it is inescapable.</p>
        </div>
      </section>

      {/* ── Act 1 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act1Steps} />
      </div>

      {/* Pull quotes */}
      <section className="py-24 px-6 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto space-y-10">
          {[
            '"I\'m not going to stop coming."',
            '"Why not, if you don\'t have anything to hide?"',
          ].map((q) => (
            <blockquote key={q} className="text-2xl md:text-3xl font-bold text-neutral-300 leading-relaxed border-l-4 border-red-500 pl-6">
              {q}
            </blockquote>
          ))}
          <p className="text-neutral-700 text-sm pl-6 italic">
            Documented investigator tactics reported by ACS-investigated families in the Bronx.
          </p>
        </div>
      </section>

      {/* ── Act 2 ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-8">
        <ScrollySection steps={act2Steps} />
      </div>

      {/* Marginal cases bridge */}
      <section className="py-24 px-6 border-t border-neutral-800 bg-neutral-800/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-2xl md:text-3xl font-extrabold leading-relaxed text-neutral-200">
            "The cases least likely to be substantiated are the cases where removal causes the most harm."
          </p>
          <div className="w-12 h-px bg-red-500 mx-auto" />
          <p className="text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
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
          <p className="text-neutral-400 text-lg leading-relaxed">
            This is not a system failing to achieve its goals. It is a system achieving exactly what it was designed to achieve: the surveillance, investigation, and control of Black and Latino families in poverty, under the cover of child protection.
          </p>
          <div className="space-y-3 text-left max-w-xl mx-auto">
            {[
              'NY accepts calls at twice the national average',
              'Investigators enter homes without warrants 99.8% of the time',
              'Black children face emergency removal at more than double the rate of white children',
              'The state pays $107,200 to separate — and refuses $300 to stabilize',
              'CARES removes children without court orders or parental notification of rights',
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <span className="text-red-500 mt-0.5 shrink-0">—</span>
                <span className="text-neutral-400 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-neutral-800 space-y-4">
            <p className="text-neutral-500 text-xs uppercase tracking-widest">What would actually help</p>
            <div className="space-y-3 text-left max-w-xl mx-auto">
              {[
                'A standardized SCR screening tool, as used by most other states',
                'Judicial oversight before — not six days after — child removal',
                'Housing subsidies, visiting nurses, food access as a first response',
                'Community-based pathways that carry no threat of investigation',
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                  <span className="text-neutral-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800">
            <p className="text-4xl md:text-6xl font-black text-neutral-700 leading-tight">
              23% were ever substantiated.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-neutral-400 mt-4 leading-tight">
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
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
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
