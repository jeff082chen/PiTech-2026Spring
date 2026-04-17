import type { StoryContentBlock, StoryNodeContent, NodesFile } from '../../types';
import rawNodes from '../../data/config/nodes.json';
import BlockEditor from './BlockEditor';

const NODES = (rawNodes as unknown as NodesFile).nodes;

const CATEGORY_BORDER: Record<string, string> = {
  hotline:       'border-yellow-600/50',
  cares:         'border-green-600/50',
  warning:       'border-amber-600/50',
  investigation: 'border-red-600/50',
  court:         'border-red-700/50',
  neutral:       'border-neutral-600/50',
};

type BlockType = 'text' | 'quote' | 'callout';

const FRESH: Record<BlockType, StoryContentBlock> = {
  text:    { type: 'text',    body: '' },
  quote:   { type: 'quote',   text: '' },
  callout: { type: 'callout', text: '' },
};

interface Props {
  nodeId:   string;
  content:  StoryNodeContent;
  onUpdate: (content: StoryNodeContent) => void;
}

export default function NodeEditor({ nodeId, content, onUpdate }: Props) {
  const nodeCfg = NODES[nodeId];
  const blocks  = content.blocks;

  const updateBlock = (index: number, block: StoryContentBlock) => {
    const next = [...blocks];
    next[index] = block;
    onUpdate({ blocks: next });
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const next = [...blocks];
    const swap = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    onUpdate({ blocks: next });
  };

  const deleteBlock = (index: number) => {
    onUpdate({ blocks: blocks.filter((_, i) => i !== index) });
  };

  const duplicateBlock = (index: number) => {
    const next = [...blocks];
    next.splice(index + 1, 0, { ...blocks[index] });
    onUpdate({ blocks: next });
  };

  const addBlock = (type: BlockType) => {
    onUpdate({ blocks: [...blocks, FRESH[type]] });
  };

  const borderCls = nodeCfg ? (CATEGORY_BORDER[nodeCfg.category] ?? 'border-neutral-700') : 'border-neutral-700';

  return (
    <div className="h-full flex flex-col">
      {/* Node reference header */}
      <div className={`px-5 py-4 border-b-2 ${borderCls} bg-neutral-950/60 shrink-0`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-neutral-100 leading-tight">
              {nodeCfg?.title ?? nodeId}
            </p>
            <p className="text-xs font-mono text-neutral-600 mt-0.5">{nodeId}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${borderCls} text-neutral-500`}>
            {nodeCfg?.category ?? ''}
          </span>
        </div>

        {nodeCfg?.description && (
          <p className="text-xs text-neutral-600 leading-relaxed mt-2 line-clamp-2">
            {nodeCfg.description}
          </p>
        )}
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {blocks.length === 0 && (
          <div className="text-center py-10">
            <p className="text-neutral-600 text-sm">No content blocks yet.</p>
            <p className="text-neutral-700 text-xs mt-1">Add a block below to start writing.</p>
          </div>
        )}

        {blocks.map((block, i) => (
          <BlockEditor
            key={i}
            block={block}
            index={i}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            onChange={b => updateBlock(i, b)}
            onMoveUp={() => moveBlock(i, 'up')}
            onMoveDown={() => moveBlock(i, 'down')}
            onDelete={() => deleteBlock(i)}
            onDuplicate={() => duplicateBlock(i)}
          />
        ))}
      </div>

      {/* Add block footer */}
      <div className="shrink-0 border-t border-neutral-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-600">Add block:</span>
          {(['text', 'quote', 'callout'] as BlockType[]).map(type => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="text-xs px-3 py-1.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors capitalize"
            >
              + {type}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-700 mt-2">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
