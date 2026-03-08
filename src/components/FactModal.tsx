import { Info, X } from 'lucide-react';
import type { Fact } from '../types';

interface Props {
  fact: Fact;
  onClose: () => void;
}

export default function FactModal({ fact, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-8 relative transform scale-100 animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-4">{fact.title}</h3>
        <p className="text-lg text-neutral-600 leading-relaxed mb-8">
          {fact.content}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Understood, return to flow
        </button>
      </div>
    </div>
  );
}
