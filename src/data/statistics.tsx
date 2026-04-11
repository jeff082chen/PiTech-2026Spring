/**
 * statistics.tsx
 *
 * Rich visual statistic components for each system node.
 * Ported and adapted from LandingPage.tsx — dark-panel styling preserved.
 *
 * Each named export is a NodeStatistic[] (zero to many per node).
 * Assigned to StoryNode.statistics[] in storyNodes.tsx.
 *
 * These are React components (TSX) — not JSON-serializable.
 * Story narrative text lives separately in src/data/mariaStory.ts (pure data).
 */

import type { NodeStatistic } from '../types';

// ─── Shared primitives ────────────────────────────────────────────────────────

function StatLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
      {children}
    </p>
  );
}

function StatCard({ stat, label }: { stat: string; label: string }) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-700/80 flex flex-col gap-2">
      <div className="text-3xl font-black text-red-400 leading-none">{stat}</div>
      <div className="text-neutral-400 text-xs leading-snug">{label}</div>
    </div>
  );
}

// ─── NODE: start ──────────────────────────────────────────────────────────────
// PipelineVisual: the full funnel from hotline call to removal

function PipelineVisual() {
  const stages = [
    { label: 'SCR Hotline Calls',         pct: 100, color: '#6b7280', note: '95,590' },
    { label: 'Passed to Agencies',        pct: 75,  color: '#9ca3af', note: '75%' },
    { label: 'Formal Investigation',      pct: 53,  color: '#b45309', note: '~53%' },
    { label: 'CARES Track',               pct: 22,  color: '#d97706', note: '22%' },
    { label: 'Indicated',                 pct: 17,  color: '#dc2626', note: '~17%' },
    { label: 'Children Removed',          pct: 8,   color: '#7f1d1d', note: '~8%' },
  ];
  return (
    <div className="w-full space-y-3">
      <StatLabel>From Call to Removal — NYC, 2023</StatLabel>
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

// SCRCounterVisual: 95,590 calls — 22,120 ever substantiated
function SCRCounterVisual() {
  return (
    <div className="w-full text-center space-y-8">
      <StatLabel>New York City, 2023</StatLabel>
      <div className="space-y-2">
        <div className="text-6xl font-black tabular-nums text-white">95,590</div>
        <p className="text-neutral-300 text-sm">calls to the SCR hotline</p>
      </div>
      <div className="w-px h-10 bg-neutral-700 mx-auto" />
      <div className="space-y-2">
        <div className="text-4xl font-black tabular-nums text-neutral-400">22,120</div>
        <p className="text-neutral-400 text-sm">
          ever substantiated <span className="text-neutral-500">(23.1%)</span>
        </p>
      </div>
      <p className="text-neutral-400 text-xs italic border-t border-neutral-700 pt-4">
        Over 73,000 families were investigated and found to have done nothing wrong.
      </p>
    </div>
  );
}

export const START_STATISTICS: NodeStatistic[] = [
  {
    id: 'start-pipeline',
    sources: [
      { label: 'NYC ACS Annual Report 2023' },
      { label: 'OCFS Statewide Central Register Data' },
    ],
    component: <PipelineVisual />,
  },
  {
    id: 'start-scr-counter',
    sources: [{ label: 'OCFS Annual Report 2023' }],
    component: <SCRCounterVisual />,
  },
];

// ─── NODE: scr_screening ──────────────────────────────────────────────────────
// BarChartVisual: NY 75% vs national average
// AnonymousTipsVisual: 6.7% vs 22.5% substantiation
// CaseVolLineVisual: case volume 2004–2023

function BarChartVisual() {
  return (
    <div className="w-full flex flex-col gap-6">
      <StatLabel>SCR Call Acceptance Rate</StatLabel>
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
      <StatLabel>Substantiation Rate Comparison</StatLabel>
      <div className="flex gap-4">
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
      <StatLabel>ACS Case Volume, 2004–2023</StatLabel>
      <svg viewBox="0 0 300 160" className="w-full">
        <defs>
          <linearGradient id="redFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20" y1="140" x2="290" y2="140" stroke="#374151" strokeWidth="1" />
        <polygon
          points="20,40 55,37 90,33 120,31 150,90 168,108 188,80 220,62 255,56 280,54 290,53 290,140 20,140"
          fill="url(#redFade)"
        />
        <polyline
          points="20,40 55,37 90,33 120,31 150,90 168,108 188,80 220,62 255,56 280,54 290,53"
          fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="20,138 80,135 120,130 150,120 188,105 240,85 280,70 290,65"
          fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3"
        />
        <rect x="148" y="10" width="42" height="130" fill="rgba(255,255,255,0.04)" rx="2" />
        <text x="169" y="22" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="600">COVID</text>
        <text x="20" y="155" fill="#6b7280" fontSize="8">2004</text>
        <text x="270" y="155" fill="#6b7280" fontSize="8">2023</text>
        <line x1="20" y1="10" x2="36" y2="10" stroke="#ef4444" strokeWidth="2.5" />
        <text x="40" y="14" fill="#d1d5db" fontSize="8">ACS Cases</text>
        <line x1="110" y1="10" x2="126" y2="10" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" />
        <text x="130" y="14" fill="#d1d5db" fontSize="8">CARES share</text>
      </svg>
      <p className="text-center text-neutral-400 text-xs italic px-4 leading-relaxed">
        Cases fell when children were home and out of sight of mandated reporters.
        They rose again when schools reopened.
      </p>
    </div>
  );
}

export const SCR_SCREENING_STATISTICS: NodeStatistic[] = [
  {
    id: 'scr-acceptance-rate',
    sources: [{ label: 'Child Welfare Information Gateway, 2021' }],
    component: <BarChartVisual />,
  },
  {
    id: 'scr-anonymous-tips',
    sources: [{ label: 'NYC ACS Data Dashboard 2023' }],
    component: <AnonymousTipsVisual />,
  },
  {
    id: 'scr-case-volume',
    sources: [
      { label: 'NYC ACS Annual Reports 2004–2023' },
      { label: 'OCFS CARES Data' },
    ],
    component: <CaseVolLineVisual />,
  },
];

// ─── NODE: safety_assessment ──────────────────────────────────────────────────
// WarrantBoxVisual: <0.2% of entries have a warrant
// InvestigatorQuotesVisual: documented coercion tactics

function WarrantBoxVisual() {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      <StatLabel>ACS Home Entries Per Year</StatLabel>
      <div className="relative w-full rounded-2xl border-2 border-neutral-500/70 bg-neutral-900/50" style={{ aspectRatio: '2' }}>
        <div className="absolute top-3 left-4">
          <div className="text-neutral-200 text-lg font-black">~56,400</div>
          <div className="text-neutral-500 text-xs">ACS home entries</div>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
          <div className="bg-red-500 rounded" style={{ width: '14px', height: '14px' }} />
          <div className="text-red-400 text-xs font-bold text-right">94 warrants</div>
        </div>
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

function InvestigatorQuotesVisual() {
  return (
    <div className="w-full space-y-5">
      <StatLabel>Documented Investigator Tactics — Bronx Families</StatLabel>
      <div className="space-y-4">
        {[
          '"I\'m not going to stop coming."',
          '"Why not, if you don\'t have anything to hide?"',
          '"We can do this the easy way or I can get a warrant."',
        ].map((q) => (
          <blockquote key={q} className="border-l-2 border-red-500 pl-4 text-neutral-200 text-sm font-semibold leading-relaxed italic">
            {q}
          </blockquote>
        ))}
      </div>
      <p className="text-neutral-500 text-xs italic pt-1 border-t border-neutral-700">
        Documented tactics reported by ACS-investigated families in the Bronx.
        Families have no right to counsel at this stage.
      </p>
    </div>
  );
}

export const SAFETY_ASSESSMENT_STATISTICS: NodeStatistic[] = [
  {
    id: 'safety-warrant-rate',
    sources: [
      { label: 'NYC ACS records, 2010–2020' },
      { label: 'Bronx Defenders client data' },
    ],
    component: <WarrantBoxVisual />,
  },
  {
    id: 'safety-investigator-quotes',
    sources: [{ label: 'Bronx Defenders, This Wound Is Still Fresh, 2023' }],
    component: <InvestigatorQuotesVisual />,
  },
];

// ─── NODE: cares_track ────────────────────────────────────────────────────────
// CARESTrendVisual: CARES share growing from 4% to 22%

function CARESTrendVisual() {
  return (
    <div className="w-full space-y-4">
      <StatLabel>CARES Share of ACS Cases</StatLabel>
      <svg viewBox="0 0 300 130" className="w-full">
        <defs>
          <linearGradient id="amberFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20" y1="115" x2="285" y2="115" stroke="#374151" strokeWidth="1" />
        <polygon
          points="20,112 70,109 120,102 170,88 215,70 260,52 285,46 285,115 20,115"
          fill="url(#amberFade)"
        />
        <polyline
          points="20,112 70,109 120,102 170,88 215,70 260,52 285,46"
          fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx="20" cy="112" r="4" fill="#f59e0b" />
        <circle cx="285" cy="46" r="5" fill="#f59e0b" />
        <text x="20" y="128" fill="#9ca3af" fontSize="9">2016</text>
        <text x="258" y="128" fill="#9ca3af" fontSize="9">2024</text>
        <text x="5" y="114" fill="#9ca3af" fontSize="9" textAnchor="end">4%</text>
        <text x="288" y="44" fill="#f59e0b" fontSize="10" fontWeight="bold">22%</text>
      </svg>
      <p className="text-center text-neutral-300 text-sm font-semibold italic">
        Reform in name. The pipeline remains.
      </p>
      <p className="text-neutral-500 text-xs italic text-center px-2 border-t border-neutral-700 pt-3">
        "CARES may function as another surveillance program."
        — The Bronx Defenders, <em>This Wound Is Still Fresh</em>
      </p>
    </div>
  );
}

export const CARES_TRACK_STATISTICS: NodeStatistic[] = [
  {
    id: 'cares-trend',
    sources: [
      { label: 'NYC ACS Annual Reports 2016–2024' },
      { label: 'Bronx Defenders, This Wound Is Still Fresh, 2023' },
    ],
    component: <CARESTrendVisual />,
  },
];

// ─── NODE: investigation ──────────────────────────────────────────────────────
// RaceRatesVisual: % of children investigated by race

function RaceRatesVisual() {
  const bars = [
    { label: 'Black children',  pct: 44, color: 'bg-red-500',     textColor: 'text-red-400' },
    { label: 'Latino children', pct: 43, color: 'bg-amber-500',   textColor: 'text-amber-400' },
    { label: 'White children',  pct: 19, color: 'bg-neutral-500', textColor: 'text-neutral-300' },
  ];
  return (
    <div className="w-full space-y-6">
      <StatLabel>% of Children Investigated by ACS, 2021</StatLabel>
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
          A Black child in NYC has nearly a <span className="text-red-400">50% chance</span> of being
          investigated by age 18.
        </p>
      </div>
    </div>
  );
}

export const INVESTIGATION_STATISTICS: NodeStatistic[] = [
  {
    id: 'investigation-race-rates',
    sources: [
      { label: 'NYC ACS Data Dashboard 2021' },
      { label: 'Center for the Study of Social Policy' },
    ],
    component: <RaceRatesVisual />,
  },
];

// ─── NODE: determination ─────────────────────────────────────────────────────
// DragnetVisual: indicated vs unsubstantiated by race
// RecordDurationVisual: 28-year SCR record

function DragnetVisual() {
  return (
    <div className="w-full space-y-5">
      <StatLabel>FY 2023 — What Follows a Report</StatLabel>
      <div className="space-y-4">
        {[
          { label: 'Black & Latino families', indicated: 18, unsub: 82 },
          { label: 'White families',           indicated: 24, unsub: 76 },
          { label: 'All families',             indicated: 23, unsub: 77 },
        ].map(({ label, indicated, unsub }) => (
          <div key={label} className="space-y-1.5">
            <div className="text-neutral-300 text-sm font-medium">{label}</div>
            <div className="flex h-8 rounded-lg overflow-hidden text-xs font-bold">
              <div
                className="bg-red-600 flex items-center justify-center text-white shrink-0"
                style={{ width: `${indicated}%` }}
              >
                {indicated}%
              </div>
              <div className="bg-neutral-700 flex items-center justify-center text-neutral-300 flex-1">
                {unsub}% unsubstantiated
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-neutral-400 text-xs italic pt-1 border-t border-neutral-700">
        In FY 2023, 56.6% of all intakes were unsubstantiated. The system is a
        high-volume, low-yield dragnet.
      </p>
    </div>
  );
}

function RecordDurationVisual() {
  return (
    <div className="w-full text-center space-y-5">
      <StatLabel>How Long an "Indicated" Finding Stays on Your Record</StatLabel>
      <div className="text-8xl font-black text-red-400 leading-none">28</div>
      <div className="text-neutral-300 font-semibold text-lg">years</div>
      <p className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">
        An "indicated" finding — requiring only "some credible evidence" — can remain
        on the State Central Register for up to 28 years.
      </p>
      <div className="grid grid-cols-2 gap-2 text-left mt-2">
        {[
          'Employment checks',
          'Housing applications',
          'Future custody cases',
          'Professional licensing',
        ].map(item => (
          <div key={item} className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-400">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export const DETERMINATION_STATISTICS: NodeStatistic[] = [
  {
    id: 'determination-dragnet',
    sources: [{ label: 'NYC ACS Data Dashboard FY2023' }],
    component: <DragnetVisual />,
  },
  {
    id: 'determination-record',
    sources: [{ label: 'NY Social Services Law §422' }],
    component: <RecordDurationVisual />,
  },
];

// ─── NODE: case_plan ──────────────────────────────────────────────────────────
// CoercedComplianceVisual: 9 in 10 experience "voluntary" as coercive

function CoercedComplianceVisual() {
  return (
    <div className="w-full space-y-5">
      <StatLabel>The Reality of "Voluntary" Service Plans</StatLabel>
      <div className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5 space-y-4 text-center">
        <div className="text-5xl font-black text-amber-400 leading-none">9 in 10</div>
        <p className="text-amber-200 text-sm leading-relaxed">
          families report experiencing ACS "voluntary" agreements as coercive
        </p>
      </div>
      <div className="space-y-2 text-sm">
        {[
          'Refusing services = evidence of non-cooperation',
          'Non-cooperation = basis for court petition',
          'Compliance extends monitoring, not ends it',
        ].map(line => (
          <div key={line} className="flex gap-2 text-neutral-400">
            <span className="text-red-500 shrink-0">•</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      <p className="text-neutral-600 text-xs italic border-t border-neutral-700 pt-3">
        "Voluntary" is a legal term, not an accurate description of how families experience
        these agreements. — Dettlaff et al., <em>Child Welfare</em>, 2020
      </p>
    </div>
  );
}

export const CASE_PLAN_STATISTICS: NodeStatistic[] = [
  {
    id: 'case-plan-coercion',
    sources: [
      { label: 'Dettlaff et al., Child Welfare, 2020' },
      { label: 'Movement for Family Power, 2020' },
    ],
    component: <CoercedComplianceVisual />,
  },
];

// ─── NODE: court_filing ───────────────────────────────────────────────────────
// GeographyVisual: Highbridge / Concourse vs Park Slope

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
      <StatLabel>FY 2023 — Geography of Intervention</StatLabel>
      <div className="flex gap-3">
        {districts.map(({ name, borough, code, intakes, filings, income, hi }) => (
          <div
            key={code}
            className={`flex-1 rounded-2xl overflow-hidden border ${
              hi ? 'border-red-700/70' : 'border-neutral-700/70'
            }`}
          >
            <div className={`px-4 py-3 ${hi ? 'bg-red-950/60' : 'bg-neutral-800/60'}`}>
              <div className={`font-black text-base leading-tight ${hi ? 'text-red-300' : 'text-neutral-200'}`}>
                {name}
              </div>
              <div className="text-neutral-500 text-xs">{borough}</div>
              <div className="text-neutral-600 text-xs mt-0.5">{code}</div>
            </div>
            <div className="bg-neutral-900/60 px-4 py-3 space-y-2.5">
              {[
                ['SCR Intakes', intakes.toLocaleString()],
                ['Article X Filings', filings],
                ['Median Income', income],
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

export const COURT_FILING_STATISTICS: NodeStatistic[] = [
  {
    id: 'court-geography',
    sources: [
      { label: 'NYC Family Court Filing Data FY2023' },
      { label: 'NYC 2020 Census — Median Household Income' },
    ],
    component: <GeographyVisual />,
  },
];

// ─── NODE: court_hearing ──────────────────────────────────────────────────────
// MariannaTwoNightsVisual: refusing painkillers out of fear of ACS
// DurationVisual: 18-month average case

function MariannaTwoNightsVisual() {
  return (
    <div className="w-full text-center space-y-5 px-2">
      <StatLabel>A Direct and Documented Consequence</StatLabel>
      <div className="text-8xl font-black text-neutral-700 leading-none">2</div>
      <div className="text-neutral-300 text-2xl font-bold">nights in pain</div>
      <div className="w-12 h-px bg-neutral-600 mx-auto" />
      <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
        Marianna Azar refused opioid painkillers after abdominal surgery — not because of
        addiction, but because she feared ACS would interpret medication on her bedside table
        as evidence of substance abuse.
      </p>
      <p className="text-neutral-600 text-xs italic">
        State-induced fear, documented by her attorney.
      </p>
    </div>
  );
}

function DurationVisual() {
  return (
    <div className="w-full space-y-4">
      <StatLabel>How Long a Family Court Case Takes</StatLabel>
      <div className="text-center space-y-1">
        <div className="text-6xl font-black text-red-400 leading-none">18</div>
        <div className="text-lg font-semibold text-neutral-300">months average</div>
      </div>
      <div className="space-y-2.5 pt-2">
        {[
          { label: 'Initial hearing',      width: '8%',  color: 'bg-neutral-600' },
          { label: 'Investigation period', width: '15%', color: 'bg-amber-600' },
          { label: 'Service compliance',   width: '30%', color: 'bg-orange-500' },
          { label: 'Follow-up hearings',   width: '47%', color: 'bg-red-600' },
        ].map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-32 shrink-0 text-xs text-neutral-500 text-right">{seg.label}</div>
            <div className="flex-1 h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div className={`h-full ${seg.color} rounded-full`} style={{ width: seg.width }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500 italic text-center border-t border-neutral-700 pt-3">
        Each hearing lasts ~30 minutes. The case lasts months to years.
      </p>
    </div>
  );
}

export const COURT_HEARING_STATISTICS: NodeStatistic[] = [
  {
    id: 'court-marianna',
    sources: [{ label: 'Bronx Defenders client documentation, 2022' }],
    component: <MariannaTwoNightsVisual />,
  },
  {
    id: 'court-duration',
    sources: [
      { label: 'Bronx Defenders, 2023' },
      { label: 'NYC Family Court caseload data' },
    ],
    component: <DurationVisual />,
  },
];

// ─── NODE: supervision_order ──────────────────────────────────────────────────
// SupervisionRenewalVisual

function SupervisionRenewalVisual() {
  return (
    <div className="w-full space-y-5">
      <StatLabel>After the Supervision Order</StatLabel>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-red-800/60 bg-red-950/20 p-4 text-center space-y-1">
          <div className="text-3xl font-black text-red-400 leading-none">1 in 3</div>
          <div className="text-xs text-red-300 leading-snug">supervision orders are renewed at least once</div>
        </div>
        <div className="rounded-2xl border border-amber-800/60 bg-amber-950/20 p-4 text-center space-y-1">
          <div className="text-3xl font-black text-amber-400 leading-none">monthly</div>
          <div className="text-xs text-amber-300 leading-snug">ACS home visits required under supervision</div>
        </div>
      </div>
      <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-400 space-y-1.5">
        <p className="font-semibold text-neutral-300">Any of the following can trigger escalation:</p>
        <p>• A new concern reported to the hotline</p>
        <p>• Missed service appointment</p>
        <p>• Housing or employment instability</p>
        <p>• Caseworker's subjective assessment</p>
      </div>
    </div>
  );
}

export const SUPERVISION_ORDER_STATISTICS: NodeStatistic[] = [
  {
    id: 'supervision-renewal',
    sources: [
      { label: 'Movement for Family Power, 2020' },
      { label: 'NYC ACS case outcome data' },
    ],
    component: <SupervisionRenewalVisual />,
  },
];

// ─── NODE: foster_care_removal ────────────────────────────────────────────────
// CostVisual: $107,200 to separate vs $3,600 to support
// MarginalCasesVisual: 3× higher arrest rate for removed children

function CostVisual() {
  return (
    <div className="w-full text-center space-y-6">
      <StatLabel>Annual Cost Comparison</StatLabel>
      <div className="rounded-2xl border border-red-800/60 bg-red-950/20 p-6">
        <div className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
          To separate a child from their family
        </div>
        <div className="text-6xl font-black text-red-400 tabular-nums">$107,200</div>
        <div className="text-neutral-400 text-sm mt-1">per child · per year · 2024</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-700" />
        <span className="text-neutral-600 text-sm font-bold uppercase tracking-wider">vs.</span>
        <div className="flex-1 h-px bg-neutral-700" />
      </div>
      <div className="rounded-2xl border border-neutral-700/60 bg-neutral-800/40 p-6">
        <div className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
          To keep Eline's family together
        </div>
        <div className="text-5xl font-black text-neutral-300 tabular-nums">$3,600</div>
        <div className="text-neutral-500 text-sm mt-1">per year ($300/month housing subsidy)</div>
      </div>
      <p className="text-neutral-400 text-sm font-semibold">The system chose separation.</p>
    </div>
  );
}

function MarginalCasesVisual() {
  return (
    <div className="w-full text-center space-y-6 px-2">
      <StatLabel>For "Marginal Cases" — Where Evidence Is Ambiguous</StatLabel>
      <p className="text-neutral-300 text-sm font-semibold leading-relaxed">
        Foster care placement can result in an adult arrest rate up to
      </p>
      <div className="text-9xl font-black text-red-400 leading-none">3×</div>
      <p className="text-neutral-300 text-base font-semibold">
        higher than if the child had stayed home.
      </p>
      <div className="w-12 h-px bg-red-800 mx-auto" />
      <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
        Researchers controlling for pre-existing conditions still find that
        placement itself causes harm — not just the circumstances that led to it.
      </p>
    </div>
  );
}

export const FOSTER_CARE_REMOVAL_STATISTICS: NodeStatistic[] = [
  {
    id: 'removal-cost',
    sources: [
      { label: 'NYC ACS Budget Data 2024' },
      { label: 'Vera Institute, The Costs of Foster Care' },
    ],
    component: <CostVisual />,
  },
  {
    id: 'removal-marginal-cases',
    sources: [
      { label: 'Doyle, Journal of Political Economy, 2007' },
      { label: 'Annie E. Casey Foundation' },
    ],
    component: <MarginalCasesVisual />,
  },
];

// ─── NODE: kinship_placement ──────────────────────────────────────────────────

function KinshipSupportGapVisual() {
  return (
    <div className="w-full space-y-5">
      <StatLabel>Support for Kinship vs. Non-Relative Foster Caregivers</StatLabel>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/40 p-4 text-center space-y-1">
          <div className="text-3xl font-black text-neutral-400 leading-none">Less</div>
          <div className="text-xs text-neutral-500 leading-snug">financial support for kinship caregivers</div>
        </div>
        <div className="rounded-2xl border border-neutral-700 bg-neutral-800/40 p-4 text-center space-y-1">
          <div className="text-3xl font-black text-neutral-400 leading-none">Fewer</div>
          <div className="text-xs text-neutral-500 leading-snug">services offered to kinship families</div>
        </div>
      </div>
      <p className="text-neutral-500 text-xs italic border-t border-neutral-700 pt-3">
        Kinship placement produces better child outcomes — yet the families who take on this
        role receive less support than licensed strangers.
      </p>
    </div>
  );
}

export const KINSHIP_PLACEMENT_STATISTICS: NodeStatistic[] = [
  {
    id: 'kinship-support-gap',
    sources: [{ label: 'Kinship Care Initiative Report, 2021' }],
    component: <KinshipSupportGapVisual />,
  },
];

// ─── NODE: group_home ─────────────────────────────────────────────────────────
// OutcomesVisual: long-term foster care outcomes
// PlacementInstabilityVisual: 1 in 4 with 3+ moves

function OutcomesVisual() {
  return (
    <div className="w-full space-y-4">
      <StatLabel>Long-Term Outcomes for Foster Youth</StatLabel>
      <div className="grid grid-cols-2 gap-3">
        <StatCard stat="28%"  label="of homeless adults spent time in foster care" />
        <StatCard stat="20%"  label="of prison inmates under 30 have a foster care history" />
        <StatCard stat="2×"   label="higher teen birth rate for girls placed in foster care" />
        <StatCard stat="−15pp" label="employment reduction in young adulthood" />
      </div>
    </div>
  );
}

function PlacementInstabilityVisual() {
  return (
    <div className="w-full space-y-7 text-center">
      <StatLabel>Placement Disruptions in Foster Care</StatLabel>
      <div className="flex justify-center gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-2 ${i === 3 ? 'opacity-100' : 'opacity-20'}`}>
            <svg viewBox="0 0 24 40" className="w-12 h-16" fill={i === 3 ? '#f87171' : '#9ca3af'}>
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

export const GROUP_HOME_STATISTICS: NodeStatistic[] = [
  {
    id: 'group-home-outcomes',
    sources: [
      { label: 'Annie E. Casey Foundation, 2021' },
      { label: 'Chapin Hall at the University of Chicago' },
    ],
    component: <OutcomesVisual />,
  },
  {
    id: 'group-home-placement-instability',
    sources: [
      { label: 'US DOJ Investigation into NYS OCFS, 2022' },
      { label: 'Chapin Hall, Midwest Evaluation of the Adult Functioning of Former Foster Youth' },
    ],
    component: <PlacementInstabilityVisual />,
  },
];
