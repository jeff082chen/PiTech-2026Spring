import type { StoryContentBlock, StoryNodeContent, StoryImage, NodesFile } from '../../types';
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

const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
const labelCls = 'block text-xs text-neutral-500 mb-1';

interface Props {
  nodeId:   string;
  content:  StoryNodeContent;
  onUpdate: (content: StoryNodeContent) => void;
}

export default function NodeEditor({ nodeId, content, onUpdate }: Props) {
  const nodeCfg = NODES[nodeId];
  const blocks  = content.blocks;
  const images  = content.images ?? [];

  // ── Block helpers ────────────────────────────────────────────────────────────

  const updateBlock = (index: number, block: StoryContentBlock) => {
    const next = [...blocks];
    next[index] = block;
    onUpdate({ ...content, blocks: next });
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const next = [...blocks];
    const swap = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    onUpdate({ ...content, blocks: next });
  };

  const deleteBlock = (index: number) => {
    onUpdate({ ...content, blocks: blocks.filter((_, i) => i !== index) });
  };

  const duplicateBlock = (index: number) => {
    const next = [...blocks];
    next.splice(index + 1, 0, { ...blocks[index] });
    onUpdate({ ...content, blocks: next });
  };

  const addBlock = (type: BlockType) => {
    onUpdate({ ...content, blocks: [...blocks, FRESH[type]] });
  };

  // ── Image helpers ────────────────────────────────────────────────────────────

  const addImage = () =>
    onUpdate({ ...content, images: [...images, { src: '', caption: '', alt: '' }] });

  const updateImage = (index: number, patch: Partial<StoryImage>) => {
    const next = [...images];
    next[index] = { ...next[index], ...patch };
    onUpdate({ ...content, images: next });
  };

  const moveImage = (index: number, dir: 'up' | 'down') => {
    const next = [...images];
    const swap = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    onUpdate({ ...content, images: next });
  };

  const removeImage = (index: number) =>
    onUpdate({ ...content, images: images.filter((_, i) => i !== index) });

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

      {/* Block list + images (scrollable) */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {blocks.length === 0 && images.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-600 text-sm">No content yet.</p>
            <p className="text-neutral-700 text-xs mt-1">Add blocks or images below.</p>
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

        {/* Images section */}
        <div className="border-t border-neutral-800/60 pt-4 mt-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Story Images
            </p>
            <button
              onClick={addImage}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <span className="text-base leading-none">+</span> Add image
            </button>
          </div>
          <p className="text-[10px] text-neutral-700 mb-3 leading-relaxed">
            Shown before statistics in the scroll sequence. Place image files in{' '}
            <span className="font-mono text-neutral-600">public/story-images/</span> and reference
            them as <span className="font-mono text-neutral-600">/story-images/filename.jpg</span>.
          </p>

          {images.length === 0 && (
            <p className="text-xs text-neutral-700 italic">No images for this node.</p>
          )}

          <div className="space-y-3">
            {images.map((img, i) => (
              <div key={i} className="border border-neutral-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-mono">Image {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveImage(i, 'up')}
                      disabled={i === 0}
                      className="text-neutral-600 hover:text-neutral-300 disabled:opacity-20 disabled:cursor-not-allowed px-1.5 text-xs transition-colors"
                      title="Move up"
                    >↑</button>
                    <button
                      onClick={() => moveImage(i, 'down')}
                      disabled={i === images.length - 1}
                      className="text-neutral-600 hover:text-neutral-300 disabled:opacity-20 disabled:cursor-not-allowed px-1.5 text-xs transition-colors"
                      title="Move down"
                    >↓</button>
                    <button
                      onClick={() => removeImage(i)}
                      className="text-neutral-600 hover:text-red-400 text-xs transition-colors ml-1"
                      title="Remove"
                    >✕</button>
                  </div>
                </div>

                {/* Preview */}
                {img.src && (
                  <img
                    src={img.src}
                    alt={img.alt ?? ''}
                    className="w-full h-28 object-cover rounded border border-neutral-700"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}

                <div>
                  <label className={labelCls}>Path</label>
                  <input
                    type="text"
                    value={img.src}
                    onChange={e => updateImage(i, { src: e.target.value })}
                    placeholder="/story-images/my-photo.jpg"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Caption (optional)</label>
                  <input
                    type="text"
                    value={img.caption ?? ''}
                    onChange={e => updateImage(i, { caption: e.target.value })}
                    placeholder="Shown below the image"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alt text (optional)</label>
                  <input
                    type="text"
                    value={img.alt ?? ''}
                    onChange={e => updateImage(i, { alt: e.target.value })}
                    placeholder="Describe the image for screen readers"
                    className={inputCls}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          {images.length > 0 && ` · ${images.length} image${images.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}
