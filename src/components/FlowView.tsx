import { useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import type { StoryNode } from '../types';
import FactModal from './FactModal';

interface Props {
  node: StoryNode;
  onChoice: (nextNodeId: string) => void;
  onBackToHome: () => void;
}

export default function FlowView({ node, onChoice, onBackToHome }: Props) {
  const [showFactModal, setShowFactModal] = useState(false);

  const handleChoice = (nextNodeId: string) => {
    setShowFactModal(false);
    onChoice(nextNodeId);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans p-4 md:p-8 flex flex-col">
      <header className="max-w-3xl w-full mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-neutral-800 tracking-tight">Family Policing Simulator</h1>
        <button
          onClick={onBackToHome}
          className="text-sm text-neutral-500 hover:text-red-600 font-medium transition-colors"
        >
          Back to Home
        </button>
      </header>

      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200">

          <div className="p-8 md:p-12 space-y-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                {node.icon}
                <h2 className="text-3xl font-extrabold text-neutral-900">{node.title}</h2>
              </div>

              {node.fact && (
                <button
                  onClick={() => setShowFactModal(true)}
                  className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors animate-pulse"
                >
                  <Info className="w-4 h-4" />
                  <span>System Reality</span>
                </button>
              )}
            </div>

            <div className="prose prose-lg text-neutral-600 leading-relaxed">
              <p>{node.description}</p>
            </div>
          </div>

          <div className="bg-neutral-50 p-8 md:p-12 border-t border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">What happens next?</h3>
            <div className="space-y-3">
              {node.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice.nextNodeId)}
                  className="w-full text-left bg-white border-2 border-neutral-200 hover:border-red-500 hover:shadow-md transition-all p-5 rounded-xl font-medium text-neutral-800 flex justify-between items-center group"
                >
                  <span>{choice.text}</span>
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {showFactModal && node.fact && (
        <FactModal fact={node.fact} onClose={() => setShowFactModal(false)} />
      )}
    </div>
  );
}
