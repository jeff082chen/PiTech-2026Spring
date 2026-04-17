import type {
  NodeConfigEntry,
  NodesFile,
  StatisticsConfig,
  NodeCategory,
} from '../../types';
import { ICON_REGISTRY } from '../../config/iconRegistry';
import { BORDER_COLOR } from '../../config/categoryStyles';
import StatisticsEditor from './StatisticsEditor';

const CATEGORIES: NodeCategory[] = ['hotline', 'cares', 'warning', 'investigation', 'court', 'neutral'];

interface Props {
  nodeId:       string;
  nodesFile:    NodesFile;
  statsConfig:  StatisticsConfig;
  onPatchNode:  (id: string, patch: Partial<NodeConfigEntry>) => void;
  onAddEdge:    (from: string, to: string, text?: string) => void;
  onRemoveEdge: (from: string, to: string) => void;
  onDeleteNode: (id: string) => void;
  onStartConnect: (fromId: string) => void;
  onDeleteStat:   (statId: string) => void;
  onReorderStats: (nodeId: string, newOrder: string[]) => void;
  onOpenStatForm: (nodeId: string, statId: string | 'new') => void;
}

export default function NodeInspector({
  nodeId, nodesFile, statsConfig,
  onPatchNode, onAddEdge, onRemoveEdge, onDeleteNode, onStartConnect,
  onDeleteStat, onReorderStats,
  onOpenStatForm,
}: Props) {
  const node = nodesFile.nodes[nodeId];
  if (!node) return null;

  const inputCls   = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
  const labelCls   = 'block text-xs text-neutral-500 mb-1';
  const sectionCls = 'border-t border-neutral-800 pt-4';
  const allNodeIds = Object.keys(nodesFile.nodes).filter(id => id !== nodeId);

  const update = (patch: Partial<NodeConfigEntry>) => onPatchNode(nodeId, patch);

  const IconComp = ICON_REGISTRY[node.icon];

  return (
    <div className="p-5 space-y-5">
      {/* ── Identity ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border-2 ${BORDER_COLOR[node.category]} bg-neutral-900`}>
            {IconComp
              ? <IconComp className={`w-6 h-6 ${node.iconColor ?? 'text-neutral-400'}`} />
              : <div className="w-6 h-6 rounded bg-neutral-700" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-200 leading-tight">{node.title}</p>
            <p className="text-xs font-mono text-neutral-600">{nodeId}</p>
          </div>
        </div>
        <button
          onClick={() => onDeleteNode(nodeId)}
          className="text-neutral-700 hover:text-red-400 text-xs transition-colors shrink-0 ml-2"
          title="Delete this node"
        >
          Delete
        </button>
      </div>

      {/* ── Basic fields ── */}
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={node.title}
            onChange={e => update({ title: e.target.value })}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={4}
            value={node.description}
            onChange={e => update({ description: e.target.value })}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={node.category}
              onChange={e => update({ category: e.target.value as NodeCategory })}
              className={inputCls}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Icon</label>
            <div className="flex gap-1.5">
              <select
                value={node.icon}
                onChange={e => update({ icon: e.target.value })}
                className={`${inputCls} flex-1`}
              >
                {Object.keys(ICON_REGISTRY).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Icon Color (Tailwind class)</label>
          <input
            type="text"
            value={node.iconColor ?? ''}
            onChange={e => update({ iconColor: e.target.value })}
            placeholder="text-neutral-400"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Canvas X</label>
            <input
              type="number"
              value={node.x}
              onChange={e => update({ x: Number(e.target.value) })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Canvas Y</label>
            <input
              type="number"
              value={node.y}
              onChange={e => update({ y: Number(e.target.value) })}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Node Type ── */}
      <div className={sectionCls}>
        <p className={labelCls}>Node Type</p>
        <div className="flex gap-2">
          {(['primary', 'hidden'] as const).map(t => (
            <button
              key={t}
              onClick={() => update({ nodeType: t, parentPrimaryId: t === 'primary' ? undefined : node.parentPrimaryId })}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors border ${
                (node.nodeType ?? 'primary') === t
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-200'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(node.nodeType === 'hidden') && (
          <div className="mt-2">
            <label className={labelCls}>Parent Primary Node ID</label>
            <select
              value={node.parentPrimaryId ?? ''}
              onChange={e => update({ parentPrimaryId: e.target.value || undefined })}
              className={inputCls}
            >
              <option value="">— none —</option>
              {Object.values(nodesFile.nodes)
                .filter(n => (n.nodeType ?? 'primary') !== 'hidden')
                .map(n => (
                  <option key={n.id} value={n.id}>{n.title} ({n.id})</option>
                ))
              }
            </select>
          </div>
        )}
      </div>

      {/* ── Choices (outgoing edges) ── */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-2">
          <p className={`${labelCls} mb-0`}>Outgoing Choices</p>
          <button
            onClick={() => onStartConnect(nodeId)}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            + Connect →
          </button>
        </div>

        <div className="space-y-2">
          {node.choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={choice.text}
                onChange={e => {
                  const choices = [...node.choices];
                  choices[i] = { ...choices[i], text: e.target.value };
                  update({ choices });
                }}
                placeholder="Choice label"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-neutral-500"
              />
              <select
                value={choice.nextNodeId}
                onChange={e => {
                  const oldTarget = choice.nextNodeId;
                  const newTarget = e.target.value;
                  const choices = [...node.choices];
                  choices[i] = { ...choices[i], nextNodeId: newTarget };
                  update({ choices });
                  // Sync edges
                  if (oldTarget) onRemoveEdge(nodeId, oldTarget);
                  if (newTarget) onAddEdge(nodeId, newTarget, choice.text);
                }}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-400 focus:outline-none focus:border-neutral-500"
              >
                <option value="">— target —</option>
                {allNodeIds.map(id => (
                  <option key={id} value={id}>{nodesFile.nodes[id].title}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  onRemoveEdge(nodeId, choice.nextNodeId);
                  update({ choices: node.choices.filter((_, j) => j !== i) });
                }}
                className="text-neutral-400 hover:text-red-400 text-xs px-1 transition-colors"
              >✕</button>
            </div>
          ))}

          {node.choices.length === 0 && (
            <p className="text-xs text-neutral-700 italic">No outgoing choices — terminal node.</p>
          )}
        </div>

        <button
          onClick={() => update({ choices: [...node.choices, { text: 'Next', nextNodeId: '' }] })}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          + Add Choice
        </button>
      </div>

      {/* ── Statistics ── */}
      <div className={sectionCls}>
        <StatisticsEditor
          nodeId={nodeId}
          node={node}
          statsConfig={statsConfig}
          onDeleteStat={onDeleteStat}
          onReorderStats={onReorderStats}
          onOpenStatForm={onOpenStatForm}
        />
      </div>
    </div>
  );
}
