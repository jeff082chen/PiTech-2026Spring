import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ZoomOut,
  Home,
  Clock,
  ChevronDown,
  X,
} from 'lucide-react';
import STORY_NODES, { EDGES } from '../data/storyNodes';
import type { NodeCategory } from '../types';

interface Props {
  onBackToLanding: () => void;
}

const CANVAS_WIDTH = 6700;
const CANVAS_HEIGHT = 4500;

const BORDER_COLOR: Record<NodeCategory, string> = {
  hotline:      'border-yellow-400',
  cares:        'border-green-400',
  warning:      'border-amber-400',
  investigation:'border-red-400',
  court:        'border-red-700',
  neutral:      'border-neutral-300',
};

export default function MapView({ onBackToLanding }: Props) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mount: brief overview pause, then zoom, then overlay card
  useEffect(() => {
    const t1 = setTimeout(() => setActiveNodeId('start'), 300);
    const t2 = setTimeout(() => setShowOverlay(true), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  const incomingNodes = useMemo(() => {
    if (!activeNodeId) return [];
    return EDGES
      .filter(edge => edge.to === activeNodeId)
      .map(edge => STORY_NODES[edge.from]);
  }, [activeNodeId]);

  const cameraTransform = useMemo(() => {
    const isMobile = viewport.w < 768;
    if (!activeNodeId) {
      const scale = Math.min(viewport.w / CANVAS_WIDTH, viewport.h / CANVAS_HEIGHT) * 0.9;
      const tx = (viewport.w - CANVAS_WIDTH * scale) / 2;
      const ty = (viewport.h - CANVAS_HEIGHT * scale) / 2;
      return { transform: `translate(${tx}px, ${ty}px) scale(${scale})` };
    } else {
      const node = STORY_NODES[activeNodeId];
      const scale = isMobile ? 0.7 : 1;
      const tx = viewport.w * 0.5 - node.x * scale;
      const ty = viewport.h * 0.5 - node.y * scale;
      return { transform: `translate(${tx}px, ${ty}px) scale(${scale})` };
    }
  }, [activeNodeId, viewport]);

  const scheduleOverlay = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setShowOverlay(false);
    overlayTimerRef.current = setTimeout(() => setShowOverlay(true), 600);
  };

  const handleNodeSelect = (nodeId: string) => {
    if (activeNodeId) setHistory(prev => [...prev, activeNodeId]);
    setActiveNodeId(nodeId);
    setShowHistoryDropdown(false);
    scheduleOverlay();
  };

  const jumpToHistory = (index: number) => {
    const targetNodeId = history[index];
    setHistory(prev => prev.slice(0, index));
    setActiveNodeId(targetNodeId);
    setShowHistoryDropdown(false);
    scheduleOverlay();
  };

  const closeToMap = () => {
    setActiveNodeId(null);
    setShowOverlay(false);
    setShowHistoryDropdown(false);
  };

  const activeNode = activeNodeId ? STORY_NODES[activeNodeId] : null;

  return (
    <div className="relative w-screen h-screen bg-neutral-100 overflow-hidden font-sans">

      {/* ── MAP CANVAS (pans & zooms in background) ── */}
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, ...cameraTransform }}
      >
        {/* SVG Edge Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {EDGES.map((edge, idx) => {
            const n1 = STORY_NODES[edge.from];
            const n2 = STORY_NODES[edge.to];
            const isActive = activeNodeId === edge.from || activeNodeId === edge.to;
            const path = `M ${n1.x} ${n1.y} C ${n1.x + 150} ${n1.y}, ${n2.x - 150} ${n2.y}, ${n2.x} ${n2.y}`;
            return (
              <path
                key={idx}
                d={path}
                fill="none"
                stroke={isActive ? '#ef4444' : '#cbd5e1'}
                strokeWidth={isActive ? 6 : 4}
                className="transition-colors duration-500"
              />
            );
          })}
        </svg>

        {/* Node Cards */}
        {Object.values(STORY_NODES).map(node => {
          const isSelected = activeNodeId === node.id;
          const isDimmed  = showOverlay && !isSelected;
          const borderColor = BORDER_COLOR[node.category];

          return (
            <div
              key={node.id}
              onClick={() => { if (!activeNodeId) handleNodeSelect(node.id); }}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center justify-center p-6
                bg-white rounded-2xl border-4 shadow-lg
                transition-all duration-500
                ${borderColor}
                ${!activeNodeId ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'pointer-events-none'}
                ${isSelected ? 'ring-8 ring-red-500/30 scale-110 z-10 shadow-red-500/20' : 'z-0'}
                ${isDimmed  ? 'opacity-30 grayscale' : 'opacity-100'}
              `}
              style={{ left: node.x, top: node.y, width: '320px' }}
            >
              <div className="mb-4">{node.icon}</div>
              <h3 className="text-xl font-bold text-neutral-900 text-center">{node.title}</h3>
              {!activeNodeId && (
                <p className="text-sm text-neutral-500 text-center mt-2 font-medium">Click to inspect</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── TOP NAVIGATION BAR ── */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
        <h1 className="text-xl md:text-2xl font-black text-neutral-900 drop-shadow-md bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-auto">
          Family Policing Map
        </h1>

        <div className="flex flex-col items-end pointer-events-auto">
          <div className="flex space-x-3">

            {/* History Dropdown */}
            {activeNodeId && (
              <div className="relative">
                <button
                  onClick={() => setShowHistoryDropdown(v => !v)}
                  className={`flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md transition-colors border ${showHistoryDropdown ? 'border-neutral-400 bg-neutral-100' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden md:inline">My History</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </button>

                {showHistoryDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Path Taken
                    </div>
                    {history.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-400 italic text-center">No history yet</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {history.map((nodeId, index) => (
                          <button
                            key={index}
                            onClick={() => jumpToHistory(index)}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 border-l-2 border-transparent hover:border-red-500 transition-colors flex items-center group"
                          >
                            <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-xs flex items-center justify-center mr-3 group-hover:bg-red-100 group-hover:text-red-600 font-bold shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-sm font-semibold text-neutral-700 truncate">
                              {STORY_NODES[nodeId].title}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full Map button */}
            {activeNodeId && (
              <button
                onClick={closeToMap}
                className="flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="hidden md:inline">Full Map</span>
              </button>
            )}

            {/* Home button */}
            <button
              onClick={onBackToLanding}
              className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── DETAIL OVERLAY (Three-panel: Left Wing / Center Card / Right Wing) ── */}
      <div
        className={`
          fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${showOverlay
            ? 'opacity-100 visible bg-black/40 backdrop-blur-sm pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
          }
        `}
        onClick={closeToMap}
      >
        {activeNode && (
          <div
            className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-[1400px] h-full md:h-auto overflow-y-auto md:overflow-visible py-20 md:py-0"
            onClick={e => { e.stopPropagation(); setShowHistoryDropdown(false); }}
          >

            {/* LEFT WING — Possible previous steps */}
            <div className="flex flex-col justify-center gap-3 w-full md:w-80 shrink-0 order-3 md:order-1">
              {incomingNodes.length > 0 ? (
                <>
                  <p className="text-white/80 text-xs font-black tracking-widest uppercase mb-1 text-center md:text-right px-2">
                    Possible Previous Steps
                  </p>
                  {incomingNodes.map((node, index) => (
                    <button
                      key={index}
                      onClick={() => handleNodeSelect(node.id)}
                      className="flex items-center text-left bg-white/95 backdrop-blur-md border-2 border-transparent hover:border-neutral-400 p-4 rounded-2xl shadow-xl transition-all hover:-translate-x-1 md:hover:-translate-x-2 group"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-400 mr-3 shrink-0 group-hover:text-neutral-700" />
                      <span className="font-bold text-neutral-700 text-sm flex-1">{node.title}</span>
                    </button>
                  ))}
                </>
              ) : (
                <p className="hidden md:block text-white/50 text-sm font-bold italic text-right px-4">
                  Starting Point
                </p>
              )}
            </div>

            {/* CENTER CARD */}
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 w-full max-w-2xl shrink-0 flex flex-col relative order-1 md:order-2 border border-neutral-100">
              <button
                onClick={closeToMap}
                className="absolute top-6 right-6 text-neutral-400 hover:text-red-500 bg-neutral-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start mb-6">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  {activeNode.icon}
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4">
                {activeNode.title}
              </h2>
              <div className="w-12 h-1 bg-red-500 mb-6 rounded-full" />
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-medium">
                {activeNode.description}
              </p>
            </div>

            {/* RIGHT WING — Next choices */}
            <div className="flex flex-col justify-center gap-3 w-full md:w-80 shrink-0 order-2 md:order-3">
              {activeNode.choices.length > 0 ? (
                <>
                  <p className="text-white/80 text-xs font-black tracking-widest uppercase mb-1 text-center md:text-left px-2">
                    Next Choices
                  </p>
                  {activeNode.choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleNodeSelect(choice.nextNodeId)}
                      className="flex items-center text-left bg-white/95 backdrop-blur-md border-2 border-transparent hover:border-red-500 p-4 rounded-2xl shadow-xl transition-all hover:translate-x-1 md:hover:translate-x-2 group"
                    >
                      <span className="font-bold text-neutral-800 text-sm flex-1">{choice.text}</span>
                      <ArrowRight className="w-5 h-5 text-neutral-400 ml-3 shrink-0 group-hover:text-red-500" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border border-neutral-200">
                  <p className="text-neutral-500 font-bold mb-4 uppercase tracking-widest text-xs">
                    End of Path
                  </p>
                  <button
                    onClick={closeToMap}
                    className="flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors font-bold shadow-md"
                  >
                    <ZoomOut className="w-4 h-4 mr-2" />
                    Return to Map
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
