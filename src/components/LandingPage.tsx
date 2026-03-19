import { useState, useEffect, useRef } from 'react';
import { Map } from 'lucide-react';

interface Props {
  onStart: () => void;
}

// ── Step definitions ──────────────────────────────────────────────────────────
// Each entry becomes one scrollytelling step. Add/reorder freely.
// The `visual` slot drives what appears in the sticky panel on the left.
interface ScrollStep {
  id: string;
  visual?: React.ReactNode;   // what the sticky panel shows at this step
  content?: React.ReactNode;  // the scrolling text/card on the right
}

const STEPS: ScrollStep[] = [
  { id: 'step-1' },
  { id: 'step-2' },
  { id: 'step-3' },
  { id: 'step-4' },
];

// ── Hook: which step is centred in the viewport ───────────────────────────────
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
      // trigger when a step crosses the vertical midpoint of the viewport
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );

    stepRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [count]);

  return { activeIndex, stepRefs };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage({ onStart }: Props) {
  const { activeIndex, stepRefs } = useActiveStep(STEPS.length);

  return (
    <div className="bg-neutral-900 text-neutral-100 font-sans selection:bg-red-500 selection:text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl w-full space-y-6">
          <h2 className="text-red-500 font-bold tracking-widest uppercase text-sm md:text-base">
            The Bronx Defenders Project
          </h2>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-tight">
            From Child Welfare <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
              To Family Policing
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
            This is a system that surveils under the guise of protection.
          </p>

          {/* Scroll cue */}
          <div className="mt-16 flex flex-col items-center gap-2 text-neutral-600 text-sm animate-bounce">
            <span>Scroll to explore</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Scrollytelling body ───────────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="flex gap-16">

          {/* Left: sticky visual panel */}
          <div className="hidden md:flex w-1/2 sticky top-0 h-screen items-center justify-center py-12">
            <div className="relative w-full h-full max-h-[600px] rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">

              {/* Swap visuals based on activeIndex — add cases as steps are filled */}
              {STEPS.map((step, i) => (
                <div
                  key={step.id}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                    i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {step.visual ?? (
                    <span className="text-neutral-600 text-sm font-mono">[{step.id} visual]</span>
                  )}
                </div>
              ))}

            </div>
          </div>

          {/* Right: scrolling steps */}
          <div className="w-full md:w-1/2 py-[20vh] space-y-[35vh]">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                ref={(el) => { stepRefs.current[i] = el; }}
                className={`transition-all duration-500 ${
                  i === activeIndex ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-2'
                }`}
              >
                {step.content ?? (
                  /* Placeholder card — replace with real content per step */
                  <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 p-8 min-h-40 flex items-center justify-center">
                    <span className="text-neutral-500 text-sm font-mono">[{step.id} content]</span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Map entry (page bottom) ───────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center border-t border-neutral-800 mt-[20vh]">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight">
            See Every Decision Point
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Navigate the full ACS flowchart interactively — every path, every outcome.
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
