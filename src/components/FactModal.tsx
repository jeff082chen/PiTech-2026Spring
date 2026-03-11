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
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 relative transform scale-100 animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-800 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 shadow-inner">
          <Info className="w-7 h-7" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-neutral-900 mb-4 leading-tight">
          {fact.title}
        </h3>
        <div className="w-12 h-1 bg-amber-400 mb-6 rounded-full" />
        <p className="text-lg text-neutral-600 leading-relaxed mb-8 font-medium">
          {fact.content}
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 bg-neutral-900 text-white font-bold text-lg rounded-xl hover:bg-neutral-800 transition-transform active:scale-95 shadow-lg"
        >
          Understood
        </button>
      </div>
    </div>
  );
}
