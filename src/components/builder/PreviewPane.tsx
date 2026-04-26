import type { StoryConfig, StoryContentBlock } from '../../types';
import rawNodes from '../../data/config/nodes.json';
import type { NodesFile } from '../../types';

const NODES = (rawNodes as unknown as NodesFile).nodes;

function renderBlock(block: StoryContentBlock, i: number) {
  if (block.type === 'text') {
    return (
      <div key={i} className="space-y-1">
        {block.title && (
          <p className="text-sm font-semibold text-neutral-200">{block.title}</p>
        )}
        <p className="text-sm text-neutral-400 leading-relaxed">{block.body}</p>
      </div>
    );
  }
  if (block.type === 'quote') {
    return (
      <blockquote key={i} className="border-l-2 border-red-600 pl-3">
        <p className="text-sm italic text-neutral-300">"{block.text}"</p>
        {block.attribution && (
          <p className="text-xs text-neutral-500 mt-1">— {block.attribution}</p>
        )}
      </blockquote>
    );
  }
  if (block.type === 'callout') {
    return (
      <div key={i} className="bg-amber-950/30 border border-amber-700/40 rounded-md px-3 py-2">
        <p className="text-sm text-amber-200 leading-relaxed">{block.text}</p>
      </div>
    );
  }
  return null;
}

interface Props {
  story: StoryConfig;
  onClose: () => void;
}

export default function PreviewPane({ story, onClose }: Props) {
  const ending = story.ending;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Preview</p>
          <p className="text-lg font-semibold text-neutral-100 leading-tight">
            {story.title || <span className="text-neutral-600 italic">Untitled Story</span>}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-200 transition-colors text-sm px-4 py-2 rounded border border-neutral-700 hover:border-neutral-500"
        >
          ✕ Close Preview
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10 space-y-10">

          {/* Character / Intro */}
          {(story.character.name || story.intro.title) && (
            <section className="space-y-3 pb-8 border-b border-neutral-800">
              <div className="inline-block bg-neutral-800 rounded-full px-3 py-0.5 text-xs text-neutral-400 uppercase tracking-widest">
                Opening
              </div>
              {story.character.name && (
                <p className="text-2xl font-black text-neutral-100">{story.character.name}</p>
              )}
              {story.character.summary && (
                <p className="text-sm text-neutral-400 leading-relaxed">{story.character.summary}</p>
              )}
              {story.intro.title && (
                <p className="text-base font-semibold text-neutral-300 mt-4">{story.intro.title}</p>
              )}
              {story.intro.description && (
                <p className="text-sm text-neutral-500 leading-relaxed">{story.intro.description}</p>
              )}
            </section>
          )}

          {/* Path nodes */}
          {story.path.length === 0 && (
            <p className="text-neutral-600 text-sm italic text-center py-8">
              No nodes in path yet.
            </p>
          )}

          {story.path.map((nodeId, idx) => {
            const nodeCfg = NODES[nodeId];
            const content = story.nodeContent[nodeId];
            const blocks = content?.blocks ?? [];

            return (
              <section key={nodeId} className="space-y-4">
                {/* Node header */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-700 font-mono w-5 text-right">{idx + 1}</span>
                  <div className="h-px flex-1 bg-neutral-800" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-300">
                      {nodeCfg?.title ?? nodeId}
                    </p>
                    <p className="text-[10px] text-neutral-600">{nodeId}</p>
                  </div>
                  <div className="h-px flex-1 bg-neutral-800" />
                </div>

                {/* System description (reference) */}
                {nodeCfg?.description && (
                  <p className="text-xs text-neutral-700 italic ml-8 leading-relaxed">
                    System: {nodeCfg.description.slice(0, 120)}{nodeCfg.description.length > 120 ? '…' : ''}
                  </p>
                )}

                {/* Story blocks */}
                {blocks.length === 0 ? (
                  <p className="text-xs text-neutral-700 italic ml-8">No content blocks for this node.</p>
                ) : (
                  <div className="ml-8 space-y-3">
                    {blocks.map((block, i) => renderBlock(block, i))}
                  </div>
                )}
              </section>
            );
          })}

          {/* Ending */}
          {ending && (ending.title || ending.description) && (
            <section className="space-y-3 pt-8 border-t border-neutral-800">
              <div className="inline-block bg-neutral-800 rounded-full px-3 py-0.5 text-xs text-neutral-400 uppercase tracking-widest">
                Ending
              </div>
              {ending.title && (
                <p className="text-xl font-bold text-neutral-200">{ending.title}</p>
              )}
              {ending.description && (
                <p className="text-sm text-neutral-400 leading-relaxed">{ending.description}</p>
              )}
              {ending.actions && ending.actions.length > 0 && (
                <ul className="space-y-1 pt-2">
                  {ending.actions.map((action, i) => (
                    <li key={i} className="text-sm text-neutral-500 flex gap-2">
                      <span className="text-red-500">→</span>
                      {action.label}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
