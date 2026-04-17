import { useState } from 'react';
import type { NodesFile } from '../../types';
import rawNodes from '../../data/config/nodes.json';

const NODES_FILE = rawNodes as unknown as NodesFile;
const ALL_NODES = NODES_FILE.nodes;

// Canonical display order (depth-first main spine)
const CANONICAL_ORDER = [
  'start', 'scr_screening', 'screened_out', 'safety_assessment', 'cares_track',
  'investigation', 'determination', 'unsubstantiated', 'case_plan', 'court_filing',
  'court_hearing', 'supervision_order', 'foster_care_removal', 'kinship_placement', 'group_home',
];

const CATEGORY_DOT: Record<string, string> = {
  hotline:       'bg-yellow-400',
  cares:         'bg-green-400',
  warning:       'bg-amber-400',
  investigation: 'bg-red-400',
  court:         'bg-red-700',
  neutral:       'bg-neutral-500',
};

interface Props {
  path:           string[];
  selectedNodeId: string | null;
  nodeContent:    Record<string, { blocks: unknown[] }>;
  onSelectNode:   (id: string) => void;
  onUpdatePath:   (path: string[]) => void;
}

export default function PathBuilder({
  path, selectedNodeId, nodeContent, onSelectNode, onUpdatePath,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const addNode = (id: string) => {
    onUpdatePath([...path, id]);
    onSelectNode(id);
    setShowPicker(false);
  };

  const removeNode = (index: number) => {
    const id = path[index];
    const hasContent = (nodeContent[id]?.blocks?.length ?? 0) > 0;
    if (hasContent) {
      const ok = window.confirm(
        `Remove "${ALL_NODES[id]?.title ?? id}" from path?\n\nThis node has content blocks. They will be preserved in the file but won't appear in the exported story unless you re-add this node.`
      );
      if (!ok) return;
    }
    const next = path.filter((_, i) => i !== index);
    onUpdatePath(next);
    if (selectedNodeId === id) onSelectNode(next[Math.min(index, next.length - 1)] ?? '');
  };

  const moveNode = (index: number, dir: 'up' | 'down') => {
    const next = [...path];
    const swap = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    onUpdatePath(next);
  };

  // Nodes available to add (all known nodes, sorted canonically, excluding already-in-path)
  const available = [
    ...CANONICAL_ORDER.filter(id => !path.includes(id) && ALL_NODES[id]),
    ...Object.keys(ALL_NODES).filter(id => !CANONICAL_ORDER.includes(id) && !path.includes(id)),
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Story Path
        </p>
        <p className="text-xs text-neutral-600 mt-0.5">{path.length} node{path.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {path.length === 0 && (
          <div className="px-4 py-8 text-center text-neutral-600 text-sm">
            Add nodes below to<br />build the story path.
          </div>
        )}

        {path.map((nodeId, index) => {
          const node    = ALL_NODES[nodeId];
          const isSelected = selectedNodeId === nodeId;
          const blockCount = nodeContent[nodeId]?.blocks?.length ?? 0;
          const dotCls = node ? (CATEGORY_DOT[node.category] ?? 'bg-neutral-500') : 'bg-neutral-700';

          return (
            <div key={`${nodeId}-${index}`} className="group relative">
              {/* Connector line */}
              {index > 0 && (
                <div className="absolute left-[27px] -top-2 w-px h-2 bg-neutral-700" />
              )}

              <div
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-900'
                }`}
                onClick={() => onSelectNode(nodeId)}
              >
                {/* Sequence number + dot */}
                <div className="flex flex-col items-center shrink-0 w-6">
                  <span className="text-[10px] text-neutral-700 font-mono leading-none mb-0.5">
                    {index + 1}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${dotCls}`} />
                </div>

                {/* Node info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${isSelected ? 'text-neutral-100' : 'text-neutral-300'}`}>
                    {node?.title ?? nodeId}
                  </p>
                  {blockCount > 0 && (
                    <p className="text-[10px] text-neutral-600">
                      {blockCount} block{blockCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Move / delete controls */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SmallBtn
                    onClick={e => { e.stopPropagation(); moveNode(index, 'up'); }}
                    disabled={index === 0}
                    title="Move up"
                    icon="↑"
                  />
                  <SmallBtn
                    onClick={e => { e.stopPropagation(); moveNode(index, 'down'); }}
                    disabled={index === path.length - 1}
                    title="Move down"
                    icon="↓"
                  />
                  <SmallBtn
                    onClick={e => { e.stopPropagation(); removeNode(index); }}
                    disabled={false}
                    title="Remove"
                    icon="✕"
                    danger
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add node section */}
      <div className="shrink-0 border-t border-neutral-800 p-3">
        {!showPicker ? (
          <button
            onClick={() => setShowPicker(true)}
            disabled={available.length === 0}
            className="w-full text-xs py-2 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Node
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">Select node to add:</p>
              <button
                onClick={() => setShowPicker(false)}
                className="text-neutral-700 hover:text-neutral-400 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 bg-neutral-900 rounded border border-neutral-800 p-1">
              {available.length === 0 && (
                <p className="text-xs text-neutral-700 text-center py-3">All nodes already in path.</p>
              )}
              {available.map(id => {
                const node = ALL_NODES[id];
                const dotCls = node ? (CATEGORY_DOT[node.category] ?? 'bg-neutral-500') : 'bg-neutral-700';
                return (
                  <button
                    key={id}
                    onClick={() => addNode(id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-800 text-left transition-colors"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
                    <span className="text-xs text-neutral-300 truncate">
                      {node?.title ?? id}
                    </span>
                    <span className="text-[10px] text-neutral-700 shrink-0 font-mono">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SmallBtn({
  onClick, disabled, title, icon, danger = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  title: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${
        danger
          ? 'text-neutral-600 hover:text-red-400 hover:bg-red-900/30'
          : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      {icon}
    </button>
  );
}
