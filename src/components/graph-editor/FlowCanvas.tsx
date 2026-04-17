import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { NodesFile } from '../../types';
import { CANVAS_W, MAP_CANVAS_H } from '../../config/constants';
import { BORDER_COLOR } from '../../config/categoryStyles';
import { ICON_REGISTRY } from '../../config/iconRegistry';
import EdgeLayer from './EdgeLayer';

export type ConnectState = { active: false } | { active: true; fromNodeId: string };

interface Props {
  nodesFile: NodesFile;
  selectedNodeId: string | null;
  connectState: ConnectState;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onConnectNode: (id: string) => void;
  onInsertOnEdge: (from: string, to: string) => void;
  onAddChildNode: (parentId: string) => void;
}

export default function FlowCanvas({
  nodesFile,
  selectedNodeId,
  connectState,
  onSelectNode,
  onMoveNode,
  onConnectNode,
  onInsertOnEdge,
  onAddChildNode,
}: Props) {
  const [viewport,      setViewport]      = useState({ w: window.innerWidth, h: window.innerHeight });
  const [userScale,     setUserScale]     = useState(0);
  const [panOffset,     setPanOffset]     = useState({ x: 0, y: 0 });
  const [isDragging,    setIsDragging]    = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [draggingNodeId,    setDraggingNodeId]    = useState<string | null>(null);
  const [pendingEdgeCursor, setPendingEdgeCursor] = useState<{ x: number; y: number } | null>(null);

  const containerRef     = useRef<HTMLDivElement>(null);
  const dragOrigin       = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const touchOrigin      = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null);
  const dragNodeOrigin   = useRef<{ screenX: number; screenY: number; nodeX: number; nodeY: number } | null>(null);
  const interactTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDragNodeRef   = useRef(false);
  const canvasDraggedRef = useRef(false);

  // Viewport resize
  useEffect(() => {
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Camera helpers (verbatim from MapView) ────────────────────────────────────

  const getAutoFit = useCallback(() => {
    const scale = Math.min(viewport.w / CANVAS_W, viewport.h / MAP_CANVAS_H) * 0.9;
    const tx    = (viewport.w - CANVAS_W     * scale) / 2;
    const ty    = (viewport.h - MAP_CANVAS_H * scale) / 2;
    return { scale, tx, ty };
  }, [viewport]);

  const getEffectiveTransform = useCallback(() => {
    if (userScale > 0) return { scale: userScale, tx: panOffset.x, ty: panOffset.y };
    return getAutoFit();
  }, [userScale, panOffset, getAutoFit]);

  const cameraTransform = useMemo(() => {
    const { scale, tx, ty } = getEffectiveTransform();
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [getEffectiveTransform]);

  const canvasTransition = (!isInteracting && !isDragging && !draggingNodeId)
    ? 'transform 400ms ease'
    : 'none';

  const resetView = () => { setUserScale(0); setPanOffset({ x: 0, y: 0 }); };

  // ── Wheel zoom (verbatim from MapView) ────────────────────────────────────────

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { scale: curScale, tx: curTx, ty: curTy } = getEffectiveTransform();
    const factor   = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.max(0.05, Math.min(4.0, curScale * factor));
    const rect     = containerRef.current?.getBoundingClientRect();
    const mx       = rect ? e.clientX - rect.left : e.clientX;
    const my       = rect ? e.clientY - rect.top  : e.clientY;
    const newTx    = mx - ((mx - curTx) / curScale) * newScale;
    const newTy    = my - ((my - curTy) / curScale) * newScale;
    setUserScale(newScale);
    setPanOffset({ x: newTx, y: newTy });
    setIsInteracting(true);
    if (interactTimer.current) clearTimeout(interactTimer.current);
    interactTimer.current = setTimeout(() => setIsInteracting(false), 150);
  }, [getEffectiveTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Canvas mouse drag / pan ───────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    canvasDraggedRef.current = false;
    const { tx, ty, scale } = getEffectiveTransform();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: tx, py: ty };
    if (userScale === 0) { setUserScale(scale); setPanOffset({ x: tx, y: ty }); }
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    // Update pending edge cursor in canvas coordinates
    if (connectState.active) {
      const { scale, tx, ty } = getEffectiveTransform();
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPendingEdgeCursor({
          x: (e.clientX - rect.left - tx) / scale,
          y: (e.clientY - rect.top  - ty) / scale,
        });
      }
    }
    if (!isDragging) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) canvasDraggedRef.current = true;
    setPanOffset({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
  };

  const onMouseUp = () => { setIsDragging(false); };

  // ── Touch pan (verbatim from MapView) ─────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const { tx, ty, scale } = getEffectiveTransform();
    touchOrigin.current = { tx: e.touches[0].clientX, ty: e.touches[0].clientY, px: tx, py: ty };
    if (userScale === 0) { setUserScale(scale); setPanOffset({ x: tx, y: ty }); }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchOrigin.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchOrigin.current.tx;
    const dy = e.touches[0].clientY - touchOrigin.current.ty;
    setPanOffset({ x: touchOrigin.current.px + dx, y: touchOrigin.current.py + dy });
  };
  const onTouchEnd = () => { touchOrigin.current = null; };

  // ── Node pointer events (drag to reposition) ──────────────────────────────────

  const onNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const node = nodesFile.nodes[nodeId];
    dragNodeOrigin.current = { screenX: e.clientX, screenY: e.clientY, nodeX: node.x, nodeY: node.y };
    didDragNodeRef.current = false;
    setDraggingNodeId(nodeId);
  };

  const onNodePointerMove = (e: React.PointerEvent, nodeId: string) => {
    if (draggingNodeId !== nodeId || !dragNodeOrigin.current) return;
    const dx = e.clientX - dragNodeOrigin.current.screenX;
    const dy = e.clientY - dragNodeOrigin.current.screenY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didDragNodeRef.current = true;
      const { scale } = getEffectiveTransform();
      onMoveNode(nodeId, dragNodeOrigin.current.nodeX + dx / scale, dragNodeOrigin.current.nodeY + dy / scale);
    }
  };

  const onNodePointerUp = (_e: React.PointerEvent, nodeId: string) => {
    setDraggingNodeId(null);
    dragNodeOrigin.current = null;
    if (!didDragNodeRef.current) {
      // It was a click
      if (connectState.active) {
        onConnectNode(nodeId);
      } else {
        onSelectNode(nodeId === selectedNodeId ? null : nodeId);
      }
    }
    didDragNodeRef.current = false;
  };

  // Canvas background click = deselect
  const handleCanvasClick = () => {
    if (!canvasDraggedRef.current) onSelectNode(null);
    canvasDraggedRef.current = false;
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const allNodes = Object.values(nodesFile.nodes);

  const pendingEdge = useMemo(() => {
    if (!connectState.active || !pendingEdgeCursor) return null;
    const fromNode = nodesFile.nodes[connectState.fromNodeId];
    if (!fromNode) return null;
    return { fromX: fromNode.x, fromY: fromNode.y, toX: pendingEdgeCursor.x, toY: pendingEdgeCursor.y };
  }, [connectState, pendingEdgeCursor, nodesFile.nodes]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 bg-neutral-100 overflow-hidden select-none ${
        connectState.active ? 'cursor-crosshair' :
        (isDragging ? 'cursor-grabbing' : 'cursor-grab')
      }`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleCanvasClick}
    >
      {/* Canvas */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: CANVAS_W, height: MAP_CANVAS_H, transform: cameraTransform, transition: canvasTransition }}
      >
        <EdgeLayer
          nodes={nodesFile.nodes}
          edges={nodesFile.edges}
          selectedNodeId={selectedNodeId}
          pendingEdge={pendingEdge}
          onInsertOnEdge={connectState.active ? undefined : onInsertOnEdge}
        />

        {allNodes.map(node => {
          const isSelected      = selectedNodeId === node.id;
          const isDraggingThis  = draggingNodeId  === node.id;
          const isHidden        = node.nodeType   === 'hidden';
          const borderColor     = BORDER_COLOR[node.category];
          const IconComp        = ICON_REGISTRY[node.icon];
          const isConnectFrom   = connectState.active && connectState.fromNodeId === node.id;

          return (
            <div
              key={node.id}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center justify-center p-4
                rounded-2xl border-4 shadow-lg
                ${borderColor}
                ${isHidden ? 'bg-neutral-50 border-dashed' : 'bg-white'}
                ${isSelected     ? 'ring-8 ring-red-500/30 z-10 shadow-red-500/20' : 'z-0'}
                ${isDraggingThis ? 'cursor-grabbing z-20 shadow-2xl !scale-110' : 'cursor-grab'}
                ${isConnectFrom  ? 'ring-8 ring-blue-500/50' : ''}
                ${connectState.active && !isConnectFrom ? 'hover:ring-4 hover:ring-blue-400/60 cursor-crosshair' : ''}
                transition-shadow duration-200
              `}
              style={{ left: node.x, top: node.y, width: isHidden ? '260px' : '300px' }}
              onPointerDown={e => onNodePointerDown(e, node.id)}
              onPointerMove={e => onNodePointerMove(e, node.id)}
              onPointerUp={e   => onNodePointerUp(e, node.id)}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              {/* Hidden badge */}
              {isHidden && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                  hidden
                </span>
              )}

              {/* Icon */}
              <div className="mb-2">
                {IconComp
                  ? <IconComp className={`w-7 h-7 ${node.iconColor ?? 'text-neutral-400'}`} />
                  : <div className="w-7 h-7 rounded bg-neutral-200" />
                }
              </div>

              {/* Title */}
              <h3 className={`font-bold text-neutral-900 text-center leading-tight ${isHidden ? 'text-sm' : 'text-base'}`}>
                {node.title}
              </h3>

              {/* Node ID */}
              <p className="text-[10px] text-neutral-400 font-mono mt-1 truncate max-w-full px-1">{node.id}</p>

              {/* Add child button (hidden in connect mode) */}
              {!connectState.active && (
                <button
                  className="mt-2 text-[10px] text-neutral-400 hover:text-blue-500 bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onAddChildNode(node.id); }}
                >
                  + Add Child
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Canvas-level toolbar (bottom-left) */}
      {userScale > 0 && (
        <button
          onClick={resetView}
          className="absolute bottom-4 left-4 z-10 text-xs px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 shadow-sm transition-colors"
        >
          ⊡ Reset View
        </button>
      )}

      {/* Connect mode hint */}
      {connectState.active && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-xs px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg pointer-events-none">
          Click a node to connect → {nodesFile.nodes[connectState.fromNodeId]?.title ?? connectState.fromNodeId}
        </div>
      )}
    </div>
  );
}
