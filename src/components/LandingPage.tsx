import { ArrowRight } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-red-500 selection:text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">

        <div className="space-y-4 text-center">
          <h2 className="text-red-500 font-bold tracking-widest uppercase text-sm md:text-base">The Bronx Defenders Project</h2>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-tight">
            From Child Welfare <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
              To Family Policing
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
            This is a system that surveils under the guise of protection. We spend millions of dollars investigating poverty—what if we spent that money fixing it?
          </p>
        </div>

        {/* Data Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
            <div className="text-5xl font-black text-white mb-2">23%</div>
            <p className="text-neutral-400 text-sm">Black people as a % of NYC population</p>
          </div>
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
            <div className="text-5xl font-black text-red-500 mb-2">41%</div>
            <p className="text-neutral-400 text-sm">Black parents in family court cases (White parents make up only 6%)</p>
          </div>
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
            <div className="text-5xl font-black text-amber-500 mb-2">&gt;95%</div>
            <p className="text-neutral-400 text-sm">Cases stemming from resource-deprived "neglect", not malicious abuse</p>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-red-600 rounded-full overflow-hidden transition-all hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50"
          >
            <span className="mr-2">Enter the System</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
