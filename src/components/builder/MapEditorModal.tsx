import { useState } from 'react';
import type { NodeConfigEntry, NodesFile, NodeCategory } from '../../types';
import rawNodes from '../../data/config/nodes.json';
import { ICON_REGISTRY } from '../../config/iconRegistry';

const INITIAL_NODES = rawNodes as unknown as NodesFile;

const CATEGORIES: NodeCategory[] = [
  'hotline', 'cares', 'warning', 'investigation', 'court', 'neutral',
];

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  hotline:       'text-yellow-400',
  cares:         'text-green-400',
  warning:       'text-amber-400',
  investigation: 'text-red-400',
  court:         'text-red-600',
  neutral:       'text-neutral-400',
};

const BLANK_NODE: NodeConfigEntry = {
  id: '', title: '', description: '', category: 'neutral',
  icon: 'ShieldAlert', iconColor: 'text-neutral-400',
  x: 0, y: 0, choices: [], statisticIds: [],
};

interface Props {
  onClose: () => void;
}

export default function MapEditorModal({ onClose }: Props) {
  const [nodesFile, setNodesFile] = useState<NodesFile>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newNode, setNewNode] = useState<NodeConfigEntry>({ ...BLANK_NODE });
  const [addError, setAddError] = useState('');

  const nodes = Object.values(nodesFile.nodes);
  const selected = selectedId ? nodesFile.nodes[selectedId] : null;

  const updateSelected = (patch: Partial<NodeConfigEntry>) => {
    if (!selectedId) return;
    setNodesFile(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [selectedId]: { ...prev.nodes[selectedId], ...patch },
      },
    }));
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      `Delete node "${nodesFile.nodes[id]?.title ?? id}"?\n\nThis will also remove all edges connected to it. Make sure no story paths reference this node.`
    );
    if (!confirmed) return;
    setNodesFile(prev => {
      const { [id]: _, ...rest } = prev.nodes;
      return {
        nodes: rest,
        edges: prev.edges.filter(e => e.from !== id && e.to !== id),
      };
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleAddNode = () => {
    setAddError('');
    if (!newNode.id.trim()) return setAddError('ID is required.');
    if (!newNode.title.trim()) return setAddError('Title is required.');
    if (nodesFile.nodes[newNode.id]) return setAddError(`ID "${newNode.id}" already exists.`);
    if (!/^[a-z0-9_]+$/.test(newNode.id)) return setAddError('ID must be lowercase letters, numbers, and underscores only.');

    setNodesFile(prev => ({
      ...prev,
      nodes: { ...prev.nodes, [newNode.id]: { ...newNode } },
    }));
    setSelectedId(newNode.id);
    setNewNode({ ...BLANK_NODE });
    setAddMode(false);
  };

  const handleDownload = () => {
    const json = JSON.stringify(nodesFile, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nodes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
  const labelCls = 'block text-xs text-neutral-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Master Map Editor</p>
          <p className="text-sm text-neutral-300">
            {nodes.length} nodes · {nodesFile.edges.length} edges
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="text-sm px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            ↓ Download nodes.json
          </button>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Node list (left) */}
        <div className="w-72 shrink-0 border-r border-neutral-800 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {nodes.map(node => (
              <div
                key={node.id}
                className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-neutral-800/50 transition-colors ${
                  selectedId === node.id
                    ? 'bg-neutral-800 border-l-2 border-l-red-600'
                    : 'hover:bg-neutral-900'
                }`}
                onClick={() => { setSelectedId(node.id); setAddMode(false); }}
              >
                <div className="min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{node.title}</p>
                  <p className={`text-xs ${CATEGORY_COLORS[node.category]}`}>{node.category}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(node.id); }}
                  className="text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
                  title="Delete node"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add node button */}
          <div className="border-t border-neutral-800 p-3">
            <button
              onClick={() => { setAddMode(true); setSelectedId(null); }}
              className="w-full text-sm py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
            >
              + Add Node
            </button>
          </div>
        </div>

        {/* Edit panel (right) */}
        <div className="flex-1 overflow-y-auto p-8">
          {!selected && !addMode && (
            <div className="text-neutral-600 text-sm text-center py-16">
              Select a node to edit, or add a new one.
            </div>
          )}

          {/* Edit existing node */}
          {selected && !addMode && (
            <div className="max-w-xl space-y-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-neutral-100">{selected.title}</p>
                <p className="text-xs font-mono text-neutral-600">{selectedId}</p>
              </div>

              <div>
                <label className={labelCls}>Title</label>
                <input
                  type="text"
                  value={selected.title}
                  onChange={e => updateSelected({ title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={5}
                  value={selected.description}
                  onChange={e => updateSelected({ description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={selected.category}
                    onChange={e => updateSelected({ category: e.target.value as NodeCategory })}
                    className={inputCls}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Icon</label>
                  <select
                    value={selected.icon}
                    onChange={e => updateSelected({ icon: e.target.value })}
                    className={inputCls}
                  >
                    {Object.keys(ICON_REGISTRY).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Canvas X</label>
                  <input
                    type="number"
                    value={selected.x}
                    onChange={e => updateSelected({ x: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Canvas Y</label>
                  <input
                    type="number"
                    value={selected.y}
                    onChange={e => updateSelected({ y: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <p className={labelCls}>Connections (choices)</p>
                <div className="space-y-1.5">
                  {selected.choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-600 font-mono w-4">{i + 1}</span>
                      <span className="text-neutral-400 flex-1 truncate">{choice.text}</span>
                      <span className="text-neutral-600 font-mono">→ {choice.nextNodeId}</span>
                    </div>
                  ))}
                  {selected.choices.length === 0 && (
                    <p className="text-neutral-700 text-xs italic">Terminal node — no outgoing choices.</p>
                  )}
                </div>
                <p className="text-[10px] text-neutral-700 mt-2">
                  Edit choices directly in <code>nodes.json</code> for precise control.
                </p>
              </div>
            </div>
          )}

          {/* Add new node form */}
          {addMode && (
            <div className="max-w-xl space-y-5">
              <p className="text-base font-semibold text-neutral-200">Add New Node</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Node ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newNode.id}
                    onChange={e => setNewNode(n => ({ ...n, id: e.target.value }))}
                    placeholder="e.g. pre_petition_conference"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-neutral-700 mt-1">Lowercase, underscores only.</p>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={newNode.category}
                    onChange={e => setNewNode(n => ({ ...n, category: e.target.value as NodeCategory }))}
                    className={inputCls}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newNode.title}
                  onChange={e => setNewNode(n => ({ ...n, title: e.target.value }))}
                  placeholder="Human-readable node name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={4}
                  value={newNode.description}
                  onChange={e => setNewNode(n => ({ ...n, description: e.target.value }))}
                  placeholder="One-sentence explanation of this stage."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Icon</label>
                  <select
                    value={newNode.icon}
                    onChange={e => setNewNode(n => ({ ...n, icon: e.target.value }))}
                    className={inputCls}
                  >
                    {Object.keys(ICON_REGISTRY).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Icon color</label>
                  <input
                    type="text"
                    value={newNode.iconColor ?? ''}
                    onChange={e => setNewNode(n => ({ ...n, iconColor: e.target.value }))}
                    placeholder="text-neutral-400"
                    className={inputCls}
                  />
                </div>
              </div>

              {addError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
                  {addError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddNode}
                  className="px-5 py-2 rounded bg-neutral-200 hover:bg-white text-neutral-900 text-sm font-medium transition-colors"
                >
                  Add Node
                </button>
                <button
                  onClick={() => { setAddMode(false); setAddError(''); setNewNode({ ...BLANK_NODE }); }}
                  className="px-5 py-2 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-neutral-700 leading-relaxed">
                After adding, set canvas coordinates (x/y) and add edges in <code>nodes.json</code>,
                or use the download button and edit the file directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
