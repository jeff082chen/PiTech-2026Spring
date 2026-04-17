import { useState } from 'react';
import type {
  NodesFile,
  StatisticsConfig,
  NodeConfigEntry,
  NodeCategory,
  StatEntry,
  StatChartConfig,
} from '../../types';
import rawNodes from '../../data/config/nodes.json';
import rawStats from '../../data/config/statistics.json';
import FlowCanvas, { type ConnectState } from './FlowCanvas';
import NodeInspector from './NodeInspector';
import StatForm from './StatForm';

const INITIAL_NODES = rawNodes as unknown as NodesFile;
const INITIAL_STATS = rawStats as unknown as StatisticsConfig;

const BLANK_NODE: NodeConfigEntry = {
  id: '', title: '', description: '', category: 'neutral',
  icon: 'ShieldAlert', iconColor: 'text-neutral-400',
  x: 0, y: 0, choices: [], statisticIds: [],
};

interface AddNodeState {
  parentId:   string;
  insertFrom?: string;
  insertTo?:  string;
}

interface Props {
  onExit: () => void;
}

export default function GraphEditor({ onExit }: Props) {
  const [nodesFile,   setNodesFile]   = useState<NodesFile>(INITIAL_NODES);
  const [statsConfig, setStatsConfig] = useState<StatisticsConfig>(INITIAL_STATS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectState,   setConnectState]   = useState<ConnectState>({ active: false });
  const [addNodeState,   setAddNodeState]   = useState<AddNodeState | null>(null);
  const [newNode,        setNewNode]        = useState<NodeConfigEntry>({ ...BLANK_NODE });
  const [addError,       setAddError]       = useState('');
  const [statModal,      setStatModal]      = useState<{ nodeId: string; statId: string | 'new' } | null>(null);

  const nodeCount = Object.keys(nodesFile.nodes).length;
  const edgeCount = nodesFile.edges.length;

  // ── Updater helpers ────────────────────────────────────────────────────────────

  const patchNode = (id: string, patch: Partial<NodeConfigEntry>) =>
    setNodesFile(prev => ({
      ...prev,
      nodes: { ...prev.nodes, [id]: { ...prev.nodes[id], ...patch } },
    }));

  const patchStat = (statId: string, patch: Partial<StatEntry>) =>
    setStatsConfig(prev => ({ ...prev, [statId]: { ...prev[statId], ...patch } }));

  const addEdge = (from: string, to: string, choiceText = 'Next') => {
    setNodesFile(prev => {
      const fromNode = prev.nodes[from];
      const toNode   = prev.nodes[to];
      if (!fromNode) return prev;
      if (fromNode.nodeType === 'hidden' && (toNode?.nodeType ?? 'primary') !== 'hidden') {
        alert(`Cannot connect: hidden nodes may not lead to primary nodes.\n\nHidden node "${fromNode.title}" → primary node "${toNode?.title ?? to}" is not allowed.`);
        return prev;
      }
      const alreadyChoice  = fromNode.choices.some(c => c.nextNodeId === to);
      const alreadyEdge    = prev.edges.some(e => e.from === from && e.to === to);
      return {
        nodes: {
          ...prev.nodes,
          [from]: {
            ...fromNode,
            choices: alreadyChoice
              ? fromNode.choices
              : [...fromNode.choices, { text: choiceText, nextNodeId: to }],
          },
        },
        edges: alreadyEdge ? prev.edges : [...prev.edges, { from, to }],
      };
    });
  };

  const removeEdge = (from: string, to: string) => {
    setNodesFile(prev => ({
      nodes: {
        ...prev.nodes,
        [from]: {
          ...prev.nodes[from],
          choices: prev.nodes[from].choices.filter(c => c.nextNodeId !== to),
        },
      },
      edges: prev.edges.filter(e => !(e.from === from && e.to === to)),
    }));
  };

  const deleteNode = (id: string) => {
    if (!window.confirm(`Delete node "${nodesFile.nodes[id]?.title ?? id}"?\n\nThis removes all edges connected to it.`)) return;
    setNodesFile(prev => {
      const { [id]: _, ...rest } = prev.nodes;
      return { nodes: rest, edges: prev.edges.filter(e => e.from !== id && e.to !== id) };
    });
    // Remove from every node's choices
    setNodesFile(prev => ({
      ...prev,
      nodes: Object.fromEntries(
        Object.entries(prev.nodes).map(([k, n]) => [
          k,
          { ...n, choices: n.choices.filter(c => c.nextNodeId !== id) },
        ])
      ),
    }));
    // Clean up stats referencing this node
    setStatsConfig(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[k].nodeId === id) delete next[k]; });
      return next;
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const moveNode = (id: string, x: number, y: number) =>
    patchNode(id, { x: Math.round(x), y: Math.round(y) });

  // ── Statistics operations ──────────────────────────────────────────────────────

  const createStat = (nodeId: string, draft: StatChartConfig) => {
    const statId = `${nodeId}-${draft.type}-${Date.now()}`;
    const entry: StatEntry = { id: statId, nodeId, sources: [], chart: draft };
    setStatsConfig(prev => ({ ...prev, [statId]: entry }));
    patchNode(nodeId, {
      statisticIds: [...(nodesFile.nodes[nodeId]?.statisticIds ?? []), statId],
    });
  };

  const updateStat = (statId: string, chart: StatChartConfig) =>
    patchStat(statId, { chart });

  const deleteStat = (statId: string) => {
    const nodeId = statsConfig[statId]?.nodeId;
    setStatsConfig(prev => {
      const next = { ...prev };
      delete next[statId];
      return next;
    });
    if (nodeId) {
      patchNode(nodeId, {
        statisticIds: (nodesFile.nodes[nodeId]?.statisticIds ?? []).filter(id => id !== statId),
      });
    }
  };

  const reorderStats = (nodeId: string, newOrder: string[]) =>
    patchNode(nodeId, { statisticIds: newOrder });

  const updateStatSources = (statId: string, sources: StatEntry['sources']) =>
    patchStat(statId, { sources });

  // ── Connect-nodes mode ────────────────────────────────────────────────────────

  const handleConnectNode = (targetId: string) => {
    if (!connectState.active) return;
    if (connectState.fromNodeId !== targetId) {
      addEdge(connectState.fromNodeId, targetId);
    }
    setConnectState({ active: false });
  };

  const startConnect = (fromNodeId: string) => {
    setConnectState({ active: true, fromNodeId });
  };

  const cancelConnect = () => setConnectState({ active: false });

  // ── Add child node ────────────────────────────────────────────────────────────

  const handleAddChildNode = (parentId: string) => {
    const parent = nodesFile.nodes[parentId];
    setNewNode({
      ...BLANK_NODE,
      x: parent.x,
      y: parent.y + 700,
      category: parent.category,
    });
    setAddNodeState({ parentId });
    setAddError('');
  };

  const handleInsertOnEdge = (from: string, to: string) => {
    const n1 = nodesFile.nodes[from];
    const n2 = nodesFile.nodes[to];
    setNewNode({
      ...BLANK_NODE,
      x: Math.round((n1.x + n2.x) / 2),
      y: Math.round((n1.y + n2.y) / 2),
      category: n1.category,
    });
    setAddNodeState({ parentId: from, insertFrom: from, insertTo: to });
    setAddError('');
  };

  const handleConfirmAddNode = () => {
    setAddError('');
    if (!newNode.id.trim()) return setAddError('ID is required.');
    if (!newNode.title.trim()) return setAddError('Title is required.');
    if (nodesFile.nodes[newNode.id]) return setAddError(`ID "${newNode.id}" already exists.`);
    if (!/^[a-z0-9_]+$/.test(newNode.id)) return setAddError('ID: lowercase letters, numbers, underscores only.');
    if (!addNodeState) return;

    const { parentId, insertFrom, insertTo } = addNodeState;
    const newId = newNode.id;

    setNodesFile(prev => ({
      nodes: { ...prev.nodes, [newId]: { ...newNode } },
      edges: prev.edges,
    }));

    addEdge(parentId, newId);

    if (insertFrom && insertTo) {
      // Splice: remove insertFrom→insertTo, add newId→insertTo
      removeEdge(insertFrom, insertTo);
      addEdge(newId, insertTo);
    }

    setSelectedNodeId(newId);
    setAddNodeState(null);
    setNewNode({ ...BLANK_NODE });
  };

  // ── Download both files ────────────────────────────────────────────────────────

  const handleDownload = () => {
    const date = new Date().toISOString().slice(0, 10);
    const trigger = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    };
    trigger(JSON.stringify(nodesFile,   null, 2), `nodes-${date}.json`);
    setTimeout(() => trigger(JSON.stringify(statsConfig, null, 2), `statistics-${date}.json`), 100);
  };

  // ── Shared input styles ────────────────────────────────────────────────────────

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
  const labelCls = 'block text-xs text-neutral-500 mb-1';

  const CATEGORIES: NodeCategory[] = ['hotline', 'cares', 'warning', 'investigation', 'court', 'neutral'];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            ← Back
          </button>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Graph Editor</p>
            <p className="text-xs text-neutral-600">{nodeCount} nodes · {edgeCount} edges</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {connectState.active && (
            <button
              onClick={cancelConnect}
              className="text-xs px-3 py-1.5 rounded border bg-blue-600 border-blue-500 text-white hover:bg-blue-700 transition-colors"
            >
              ✕ Cancel Connect
            </button>
          )}

          <button
            onClick={handleDownload}
            className="text-xs px-4 py-1.5 rounded bg-neutral-200 hover:bg-white text-neutral-900 font-medium transition-colors"
          >
            ↓ Download Both
          </button>
        </div>
      </div>

      {/* ── Main layout: canvas + inspector ── */}
      <div className="flex flex-1 min-h-0">
        <FlowCanvas
          nodesFile={nodesFile}
          selectedNodeId={selectedNodeId}
          connectState={connectState}
          onSelectNode={setSelectedNodeId}
          onMoveNode={moveNode}
          onConnectNode={handleConnectNode}
          onInsertOnEdge={handleInsertOnEdge}
          onAddChildNode={handleAddChildNode}
        />

        {/* Right panel */}
        {(selectedNodeId || addNodeState) && (
          <div className="w-[400px] shrink-0 border-l border-neutral-800 overflow-y-auto bg-neutral-950">
            {addNodeState ? (
              /* ── Add node form ── */
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-200">
                    {addNodeState.insertFrom ? 'Insert Node on Edge' : `Add Child of "${nodesFile.nodes[addNodeState.parentId]?.title}"`}
                  </p>
                  <button
                    onClick={() => setAddNodeState(null)}
                    className="text-neutral-600 hover:text-neutral-300 text-xs"
                  >✕</button>
                </div>

                <div>
                  <label className={labelCls}>Node ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newNode.id}
                    onChange={e => setNewNode(n => ({ ...n, id: e.target.value }))}
                    placeholder="lowercase_underscore"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newNode.title}
                    onChange={e => setNewNode(n => ({ ...n, title: e.target.value }))}
                    placeholder="Human-readable name"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select
                      value={newNode.category}
                      onChange={e => setNewNode(n => ({ ...n, category: e.target.value as NodeCategory }))}
                      className={inputCls}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Node Type</label>
                    <select
                      value={newNode.nodeType ?? 'primary'}
                      onChange={e => setNewNode(n => ({ ...n, nodeType: e.target.value as 'primary' | 'hidden' }))}
                      className={inputCls}
                    >
                      <option value="primary">primary</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Canvas X</label>
                    <input type="number" value={newNode.x} onChange={e => setNewNode(n => ({ ...n, x: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Canvas Y</label>
                    <input type="number" value={newNode.y} onChange={e => setNewNode(n => ({ ...n, y: Number(e.target.value) }))} className={inputCls} />
                  </div>
                </div>

                {addError && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{addError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={handleConfirmAddNode} className="flex-1 py-2 rounded bg-neutral-200 hover:bg-white text-neutral-900 text-sm font-medium transition-colors">
                    Add Node
                  </button>
                  <button onClick={() => { setAddNodeState(null); setAddError(''); }} className="px-4 py-2 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedNodeId && (
              /* ── Node Inspector ── */
              <NodeInspector
                nodeId={selectedNodeId}
                nodesFile={nodesFile}
                statsConfig={statsConfig}
                onPatchNode={patchNode}
                onAddEdge={addEdge}
                onRemoveEdge={removeEdge}
                onDeleteNode={deleteNode}
                onStartConnect={startConnect}
                onDeleteStat={deleteStat}
                onReorderStats={reorderStats}
                onOpenStatForm={(nid, sid) => setStatModal({ nodeId: nid, statId: sid })}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Stat editor modal ── */}
      {statModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setStatModal(null)}
        >
          <div
            className="relative bg-neutral-950 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
              <p className="text-sm font-semibold text-neutral-200">
                {statModal.statId === 'new' ? 'New Statistic' : `Edit: ${statModal.statId}`}
              </p>
              <button onClick={() => setStatModal(null)} className="text-neutral-500 hover:text-neutral-200 text-sm transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <StatForm
                initialChart={statModal.statId !== 'new' ? statsConfig[statModal.statId]?.chart : undefined}
                initialSources={statModal.statId !== 'new' ? statsConfig[statModal.statId]?.sources : undefined}
                onSave={(chart, sources) => {
                  if (statModal.statId === 'new') {
                    createStat(statModal.nodeId, chart);
                  } else {
                    updateStat(statModal.statId, chart);
                    updateStatSources(statModal.statId, sources);
                  }
                  setStatModal(null);
                }}
                onCancel={() => setStatModal(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
