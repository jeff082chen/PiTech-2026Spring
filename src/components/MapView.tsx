import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ZoomOut,
  Home,
  Clock,
  ChevronDown,
  X,
  Minimize2,
} from 'lucide-react';
import STORY_NODES, { EDGES } from '../data/storyNodes';
import { CANVAS_W, MAP_CANVAS_H, MOBILE_BREAKPOINT } from '../config/constants';
import { BORDER_COLOR } from '../config/categoryStyles';

interface Props {
  onBackToLanding: () => void;
}

export default function MapView({ onBackToLanding }: Props) {
  const [activeNodeId,        setActiveNodeId]        = useState<string | null>(null);
  const [showOverlay,         setShowOverlay]         = useState(false);
  const [history,             setHistory]             = useState<string[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [viewport,            setViewport]            = useState({ w: window.innerWidth, h: window.innerHeight });
  const [expandedNodeIds,     setExpandedNodeIds]     = useState<Set<string>>(new Set());
  const [userScale,           setUserScale]           = useState(0);        // 0 = auto-fit
  const [panOffset,           setPanOffset]           = useState({ x: 0, y: 0 });
  const [isDragging,          setIsDragging]          = useState(false);
  const [isInteracting,       setIsInteracting]       = useState(false);

  const overlayTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOrigin       = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const touchOrigin      = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null);
  const containerRef     = useRef<HTMLDivElement>(null);

  // ── Viewport resize ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── On mount: cleanup only ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  // ── Derived: which primary nodes have expandable children ───────────────────

  const expandableNodeIds = useMemo(() => {
    return new Set(
      Object.values(STORY_NODES)
        .filter(n => n.nodeType === 'hidden' && n.parentPrimaryId)
        .map(n => n.parentPrimaryId!)
    );
  }, []);

  // ── Derived: which nodes & edges are currently visible ──────────────────────

  const visibleNodes = useMemo(() => {
    return Object.values(STORY_NODES).filter(n =>
      n.nodeType !== 'hidden' ||
      (n.parentPrimaryId != null && expandedNodeIds.has(n.parentPrimaryId))
    );
  }, [expandedNodeIds]);

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
  }, [visibleNodes]);

  // ── Auto-fit helpers (reused in event handlers) ──────────────────────────────

  const getAutoFit = useCallback(() => {
    const scale = Math.min(viewport.w / CANVAS_W, viewport.h / MAP_CANVAS_H) * 0.9;
    const tx    = (viewport.w  - CANVAS_W      * scale) / 2;
    const ty    = (viewport.h  - MAP_CANVAS_H  * scale) / 2;
    return { scale, tx, ty };
  }, [viewport]);

  const getEffectiveTransform = useCallback(() => {
    if (userScale > 0) return { scale: userScale, tx: panOffset.x, ty: panOffset.y };
    return getAutoFit();
  }, [userScale, panOffset, getAutoFit]);

  // ── Camera transform ─────────────────────────────────────────────────────────

  const cameraTransform = useMemo(() => {
    if (activeNodeId) {
      const isMobile = viewport.w < MOBILE_BREAKPOINT;
      const node     = STORY_NODES[activeNodeId];
      const scale    = isMobile ? 0.7 : 1;
      const tx       = viewport.w * 0.5 - node.x * scale;
      const ty       = viewport.h * 0.5 - node.y * scale;
      return `translate(${tx}px, ${ty}px) scale(${scale})`;
    }
    const { scale, tx, ty } = getEffectiveTransform();
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [activeNodeId, viewport, getEffectiveTransform]);

  const canvasTransition = (activeNodeId || (!isInteracting && !isDragging))
    ? 'transform 1000ms cubic-bezier(0.25,1,0.5,1)'
    : 'none';

  // ── Overlay helpers ──────────────────────────────────────────────────────────

  const scheduleOverlay = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setShowOverlay(false);
    overlayTimerRef.current = setTimeout(() => setShowOverlay(true), 600);
  };

  // ── Node navigation (zoom + overlay) ────────────────────────────────────────

  const handleNodeSelect = (nodeId: string) => {
    if (activeNodeId) setHistory(prev => [...prev, activeNodeId]);
    setActiveNodeId(nodeId);
    setShowHistoryDropdown(false);
    // Auto-expand parent when navigating to a hidden node
    const node = STORY_NODES[nodeId];
    if (node?.nodeType === 'hidden' && node.parentPrimaryId) {
      setExpandedNodeIds(prev => new Set([...prev, node.parentPrimaryId!]));
    }
    scheduleOverlay();
  };

  // ── Node click (overview) — expand first, then zoom+overlay ─────────────────

  const handleNodeClick = (nodeId: string) => {
    const isExpandable    = expandableNodeIds.has(nodeId);
    const isAlreadyExpanded = expandedNodeIds.has(nodeId);

    if (isExpandable && !isAlreadyExpanded) {
      setExpandedNodeIds(prev => new Set([...prev, nodeId]));
      return;
    }
    handleNodeSelect(nodeId);
  };

  // ── Expand/collapse badge toggle ─────────────────────────────────────────────

  const toggleExpand = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // ── History navigation ───────────────────────────────────────────────────────

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

  const resetView = () => {
    setUserScale(0);
    setPanOffset({ x: 0, y: 0 });
  };

  // ── Mouse wheel zoom ─────────────────────────────────────────────────────────

  const onWheel = useCallback((e: WheelEvent) => {
    if (activeNodeId) return;
    e.preventDefault();

    const { scale: curScale, tx: curTx, ty: curTy } = getEffectiveTransform();
    const factor   = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.max(0.05, Math.min(4.0, curScale * factor));

    const rect = containerRef.current?.getBoundingClientRect();
    const mx   = rect ? e.clientX - rect.left : e.clientX;
    const my   = rect ? e.clientY - rect.top  : e.clientY;

    const newTx = mx - ((mx - curTx) / curScale) * newScale;
    const newTy = my - ((my - curTy) / curScale) * newScale;

    setUserScale(newScale);
    setPanOffset({ x: newTx, y: newTy });
    setIsInteracting(true);
    if (interactTimer.current) clearTimeout(interactTimer.current);
    interactTimer.current = setTimeout(() => setIsInteracting(false), 150);
  }, [activeNodeId, getEffectiveTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Mouse drag pan ───────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    if (activeNodeId || e.button !== 0) return;
    const { tx, ty, scale } = getEffectiveTransform();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: tx, py: ty };
    if (userScale === 0) {
      setUserScale(scale);
      setPanOffset({ x: tx, y: ty });
    }
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    setPanOffset({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
  };

  const onMouseUp = () => setIsDragging(false);

  // ── Touch drag pan ───────────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    if (activeNodeId || e.touches.length !== 1) return;
    const { tx, ty, scale } = getEffectiveTransform();
    touchOrigin.current = { tx: e.touches[0].clientX, ty: e.touches[0].clientY, px: tx, py: ty };
    if (userScale === 0) {
      setUserScale(scale);
      setPanOffset({ x: tx, y: ty });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchOrigin.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchOrigin.current.tx;
    const dy = e.touches[0].clientY - touchOrigin.current.ty;
    setPanOffset({ x: touchOrigin.current.px + dx, y: touchOrigin.current.py + dy });
  };

  const onTouchEnd = () => { touchOrigin.current = null; };

  // ── Derived: incoming visible nodes for the overlay ─────────────────────────

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const incomingNodes = useMemo(() => {
    if (!activeNodeId) return [];
    return EDGES
      .filter(edge => edge.to === activeNodeId && visibleNodeIds.has(edge.from))
      .map(edge => STORY_NODES[edge.from]);
  }, [activeNodeId, visibleNodeIds]);

  const activeNode = activeNodeId ? STORY_NODES[activeNodeId] : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen bg-neutral-100 overflow-hidden font-sans select-none ${
        isDragging ? 'cursor-grabbing' : (!activeNodeId ? 'cursor-grab' : '')
      }`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* ── MAP CANVAS ── */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: CANVAS_W,
          height: MAP_CANVAS_H,
          transform: cameraTransform,
          transition: canvasTransition,
        }}
      >
        {/* SVG Edge Layer */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_W, height: MAP_CANVAS_H }}>
          {visibleEdges.map((edge, idx) => {
            const n1 = STORY_NODES[edge.from];
            const n2 = STORY_NODES[edge.to];
            if (!n1 || !n2) return null;
            const isActive = activeNodeId === edge.from || activeNodeId === edge.to;
            const isHiddenEdge = n1.nodeType === 'hidden' || n2.nodeType === 'hidden';
            const midX = (n1.x + n2.x) / 2;
            const path = `M ${n1.x} ${n1.y} C ${midX} ${n1.y}, ${midX} ${n2.y}, ${n2.x} ${n2.y}`;
            return (
              <path
                key={idx}
                d={path}
                fill="none"
                stroke={isActive ? '#ef4444' : (isHiddenEdge ? '#94a3b8' : '#cbd5e1')}
                strokeWidth={isActive ? 6 : (isHiddenEdge ? 3 : 4)}
                strokeDasharray={isHiddenEdge && !isActive ? '8 4' : undefined}
                className="transition-colors duration-500"
              />
            );
          })}
        </svg>

        {/* Node Cards */}
        {visibleNodes.map(node => {
          const isSelected    = activeNodeId === node.id;
          const isDimmed      = showOverlay && !isSelected;
          const borderColor   = BORDER_COLOR[node.category];
          const isExpandable  = expandableNodeIds.has(node.id);
          const isExpanded    = expandedNodeIds.has(node.id);
          const isHidden      = node.nodeType === 'hidden';

          return (
            <div
              key={node.id}
              onClick={() => { if (!activeNodeId) handleNodeClick(node.id); }}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center justify-center p-6
                rounded-2xl border-4 shadow-lg
                transition-all duration-500
                ${borderColor}
                ${isHidden ? 'bg-neutral-50' : 'bg-white'}
                ${!activeNodeId ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'pointer-events-none'}
                ${isSelected  ? 'ring-8 ring-red-500/30 scale-110 z-10 shadow-red-500/20' : 'z-0'}
                ${isDimmed    ? 'opacity-30 grayscale' : 'opacity-100'}
              `}
              style={{ left: node.x, top: node.y, width: isHidden ? '280px' : '320px' }}
            >
              {/* Expand/collapse badge */}
              {isExpandable && (
                <button
                  onClick={e => toggleExpand(e, node.id)}
                  className={`
                    absolute -top-3 -right-3 w-7 h-7 rounded-full border-2 border-white
                    text-white text-sm font-bold flex items-center justify-center shadow-md z-20
                    transition-colors pointer-events-auto
                    ${isExpanded ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-700 hover:bg-neutral-900'}
                  `}
                  title={isExpanded ? 'Collapse sub-nodes' : 'Expand hidden nodes'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              )}

              <div className="mb-4">{node.icon}</div>
              <h3 className={`font-bold text-neutral-900 text-center ${isHidden ? 'text-base' : 'text-xl'}`}>
                {node.title}
              </h3>
              {!activeNodeId && (
                <p className="text-xs text-neutral-400 text-center mt-2 font-medium">
                  {isExpandable && !isExpanded ? 'Click to expand' : 'Click to inspect'}
                </p>
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
          <div className="flex space-x-3 flex-wrap justify-end gap-y-2">

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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden z-50 opacity-0 animate-[fadeSlideDown_150ms_ease_forwards]">
                    <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Path Taken
                    </div>
                    {history.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-400 italic text-center">No history yet</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {history.map((nodeId, index) => (
                          <button
                            key={`${nodeId}-${index}`}
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

            {/* Full Map button (when zoomed to a node) */}
            {activeNodeId && (
              <button
                onClick={closeToMap}
                className="flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="hidden md:inline">Full Map</span>
              </button>
            )}

            {/* Reset zoom button (when user has zoomed/panned in overview) */}
            {!activeNodeId && userScale > 0 && (
              <button
                onClick={resetView}
                className="flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden md:inline">Reset View</span>
              </button>
            )}

            {/* Collapse all expanded nodes */}
            {!activeNodeId && expandedNodeIds.size > 0 && (
              <button
                onClick={() => setExpandedNodeIds(new Set())}
                className="flex items-center space-x-2 bg-white text-neutral-700 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <span className="text-sm">−</span>
                <span className="hidden md:inline">Collapse All</span>
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

      {/* ── DETAIL OVERLAY ── */}
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
                {activeNode.nodeType === 'hidden' && (
                  <span className="ml-3 self-center text-xs font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                    Expanded Detail
                  </span>
                )}
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
