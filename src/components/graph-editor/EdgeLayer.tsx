import type { NodeConfigEntry, Edge } from '../../types';
import { CANVAS_W, MAP_CANVAS_H } from '../../config/constants';

interface PendingEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface Props {
  nodes: Record<string, NodeConfigEntry>;
  edges: Edge[];
  selectedNodeId: string | null;
  pendingEdge?: PendingEdge | null;
  onInsertOnEdge?: (from: string, to: string) => void;
}

export default function EdgeLayer({ nodes, edges, selectedNodeId, pendingEdge, onInsertOnEdge }: Props) {
  return (
    <svg
      className="absolute inset-0"
      style={{ width: CANVAS_W, height: MAP_CANVAS_H, pointerEvents: 'none' }}
    >
      {edges.map((edge, idx) => {
        const n1 = nodes[edge.from];
        const n2 = nodes[edge.to];
        if (!n1 || !n2) return null;
        const isActive     = selectedNodeId === edge.from || selectedNodeId === edge.to;
        const isHiddenEdge = n1.nodeType === 'hidden' || n2.nodeType === 'hidden';
        const midX         = (n1.x + n2.x) / 2;
        const d            = `M ${n1.x} ${n1.y} C ${midX} ${n1.y}, ${midX} ${n2.y}, ${n2.x} ${n2.y}`;

        return (
          <g key={idx}>
            {/* Visible edge */}
            <path
              d={d}
              fill="none"
              stroke={isActive ? '#ef4444' : (isHiddenEdge ? '#94a3b8' : '#cbd5e1')}
              strokeWidth={isActive ? 6 : (isHiddenEdge ? 3 : 4)}
              strokeDasharray={isHiddenEdge && !isActive ? '8 4' : undefined}
              className="transition-colors duration-300"
            />
            {/* Wide invisible hit area — click to insert node on this edge */}
            {onInsertOnEdge && (
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                pointerEvents="stroke"
                style={{ cursor: 'cell' }}
                onClick={e => { e.stopPropagation(); onInsertOnEdge(edge.from, edge.to); }}
              />
            )}
          </g>
        );
      })}

      {/* Pending edge preview (connect-nodes mode) */}
      {pendingEdge && (
        <line
          x1={pendingEdge.fromX}
          y1={pendingEdge.fromY}
          x2={pendingEdge.toX}
          y2={pendingEdge.toY}
          stroke="#3b82f6"
          strokeWidth={3}
          strokeDasharray="8 4"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
