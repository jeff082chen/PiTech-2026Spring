import type { StoryContentBlock } from '../../types';

type BlockType = 'text' | 'quote' | 'callout';

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'text',    label: 'Text' },
  { value: 'quote',   label: 'Quote' },
  { value: 'callout', label: 'Callout' },
];

const TYPE_COLORS: Record<BlockType, string> = {
  text:    'bg-blue-900/40 text-blue-300 border-blue-700/50',
  quote:   'bg-amber-900/40 text-amber-300 border-amber-700/50',
  callout: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
};

const FRESH_BLOCK: Record<BlockType, StoryContentBlock> = {
  text:    { type: 'text',    body: '' },
  quote:   { type: 'quote',   text: '' },
  callout: { type: 'callout', text: '' },
};

interface Props {
  block:       StoryContentBlock;
  index:       number;
  isFirst:     boolean;
  isLast:      boolean;
  onChange:    (block: StoryContentBlock) => void;
  onMoveUp:    () => void;
  onMoveDown:  () => void;
  onDelete:    () => void;
  onDuplicate: () => void;
}

export default function BlockEditor({
  block, index, isFirst, isLast,
  onChange, onMoveUp, onMoveDown, onDelete, onDuplicate,
}: Props) {
  const type = block.type as BlockType;

  const handleTypeChange = (newType: BlockType) => {
    if (newType !== type) onChange(FRESH_BLOCK[newType]);
  };

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 resize-none';
  const labelCls = 'block text-xs text-neutral-500 mb-1';

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-neutral-600 text-xs font-mono w-4">{index + 1}</span>

        {/* Type selector */}
        <div className="flex gap-1">
          {BLOCK_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTypeChange(value)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                type === value
                  ? TYPE_COLORS[value]
                  : 'bg-transparent text-neutral-600 border-neutral-800 hover:text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn onClick={onMoveUp}    disabled={isFirst}  title="Move up"    icon="↑" />
          <IconBtn onClick={onMoveDown}  disabled={isLast}   title="Move down"  icon="↓" />
          <IconBtn onClick={onDuplicate} disabled={false}    title="Duplicate"  icon="⧉" />
          <IconBtn onClick={onDelete}    disabled={false}    title="Delete"     icon="✕" danger />
        </div>
      </div>

      {/* Block fields */}
      <div className="p-3 space-y-2 bg-neutral-950/40">
        {block.type === 'text' && (
          <>
            <div>
              <label className={labelCls}>Title <span className="text-neutral-700">(optional)</span></label>
              <input
                type="text"
                value={block.title ?? ''}
                onChange={e => onChange({ ...block, title: e.target.value || undefined })}
                placeholder="Section heading"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Body</label>
              <textarea
                rows={4}
                value={block.body}
                onChange={e => onChange({ ...block, body: e.target.value })}
                placeholder="Narrative paragraph..."
                className={inputCls}
              />
            </div>
          </>
        )}

        {block.type === 'quote' && (
          <>
            <div>
              <label className={labelCls}>Quote text</label>
              <textarea
                rows={3}
                value={block.text}
                onChange={e => onChange({ ...block, text: e.target.value })}
                placeholder='"Their exact words or a striking statement."'
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Attribution <span className="text-neutral-700">(optional)</span></label>
              <input
                type="text"
                value={block.attribution ?? ''}
                onChange={e => onChange({ ...block, attribution: e.target.value || undefined })}
                placeholder="e.g. Maria, client of The Bronx Defenders"
                className={inputCls}
              />
            </div>
          </>
        )}

        {block.type === 'callout' && (
          <div>
            <label className={labelCls}>Callout text</label>
            <textarea
              rows={3}
              value={block.text}
              onChange={e => onChange({ ...block, text: e.target.value })}
              placeholder="A key fact, legal note, or highlighted observation."
              className={inputCls}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  onClick, disabled, title, icon, danger = false,
}: {
  onClick: () => void;
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
      className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
        danger
          ? 'text-neutral-600 hover:text-red-400 hover:bg-red-900/30'
          : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      {icon}
    </button>
  );
}
