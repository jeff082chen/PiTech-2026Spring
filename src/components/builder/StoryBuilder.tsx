import { useState, useRef, useCallback } from 'react';
import type { StoryConfig, StoryNodeContent, StoryContentBlock } from '../../types';
import storyJson from '../../data/stories/story.json';

import MetadataEditor  from './MetadataEditor';
import PathBuilder     from './PathBuilder';
import NodeEditor      from './NodeEditor';
import StatsLibrary    from './StatsLibrary';
import PreviewPane     from './PreviewPane';

const MARIA_STORY = storyJson as unknown as StoryConfig;

const EMPTY_STORY: StoryConfig = {
  id: '',
  title: '',
  character: { name: '', summary: '' },
  intro:     { title: '', description: '' },
  path:      [],
  nodeContent: {},
  ending:    { title: '', description: '', actions: [] },
};

interface Props {
  onExit: () => void;
  onOpenGraphEditor: () => void;
}

export default function StoryBuilder({ onExit, onOpenGraphEditor }: Props) {
  const [story,          setStory]          = useState<StoryConfig>(MARIA_STORY);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(story.path[0] ?? null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const importRef = useRef<HTMLInputElement>(null);

  // ── Story-level updaters ─────────────────────────────────────────────────────

  const patchStory = useCallback((patch: Partial<StoryConfig>) => {
    setStory(prev => ({ ...prev, ...patch }));
  }, []);

  const updatePath = useCallback((path: string[]) => {
    setStory(prev => ({ ...prev, path }));
  }, []);

  const updateNodeContent = useCallback((nodeId: string, content: StoryNodeContent) => {
    setStory(prev => ({
      ...prev,
      nodeContent: { ...prev.nodeContent, [nodeId]: content },
    }));
  }, []);

  const insertBlock = useCallback((block: StoryContentBlock) => {
    if (!selectedNodeId) return;
    setStory(prev => {
      const existing = prev.nodeContent[selectedNodeId] ?? { blocks: [] };
      return {
        ...prev,
        nodeContent: {
          ...prev.nodeContent,
          [selectedNodeId]: { blocks: [...existing.blocks, block] },
        },
      };
    });
  }, [selectedNodeId]);

  // ── Export / Import ──────────────────────────────────────────────────────────

  const handleDownload = () => {
    const json = JSON.stringify(story, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${story.id || 'story'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(story, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as StoryConfig;
        if (!Array.isArray(parsed.path)) throw new Error('Missing path array');
        setStory(parsed);
        setSelectedNodeId(parsed.path[0] ?? null);
      } catch {
        alert('Could not load file — invalid story JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNew = () => {
    const ok = window.confirm(
      'Start a new story?\n\nAll unsaved content will be lost. Export your JSON first if you want to keep it.'
    );
    if (!ok) return;
    setStory(EMPTY_STORY);
    setSelectedNodeId(null);
  };

  const handleSelectNode = (id: string) => {
    // Auto-initialise empty nodeContent entry when first selecting a node
    setStory(prev => {
      if (prev.nodeContent[id]) return prev;
      return {
        ...prev,
        nodeContent: { ...prev.nodeContent, [id]: { blocks: [] } },
      };
    });
    setSelectedNodeId(id);
  };

  // ── Derived state ────────────────────────────────────────────────────────────

  const selectedContent = selectedNodeId
    ? (story.nodeContent[selectedNodeId] ?? { blocks: [] })
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-200 flex flex-col overflow-hidden">

      {/* Modals */}
      {showPreview && <PreviewPane story={story} onClose={() => setShowPreview(false)} />}

      {/* Top bar */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-950">
        <button
          onClick={onExit}
          className="text-neutral-600 hover:text-neutral-300 text-xs px-2 py-1 rounded border border-neutral-800 hover:border-neutral-700 transition-colors shrink-0"
          title="Back to site"
        >
          ← Site
        </button>

        <div className="w-px h-5 bg-neutral-800 shrink-0" />

        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 shrink-0">
          Story Builder
        </p>

        <p className="text-sm text-neutral-600 truncate min-w-0 flex-1">
          {story.title || <span className="italic">Untitled story</span>}
          {story.id ? <span className="text-neutral-700 font-mono ml-2 text-xs">({story.id})</span> : null}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          <TopBtn onClick={handleNew}    label="New" />

          <label className="cursor-pointer">
            <span className="text-xs px-3 py-1.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 transition-colors">
              Import
            </span>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <div className="w-px h-5 bg-neutral-800" />

          <TopBtn onClick={handleDownload}                  label="↓ Download" primary />
          <TopBtn onClick={handleCopy} label={copied ? '✓ Copied' : '⎘ Copy'} />

          <div className="w-px h-5 bg-neutral-800" />

          <TopBtn onClick={onOpenGraphEditor} label="Graph Editor" />
          <TopBtn onClick={() => setShowPreview(true)}   label="Preview" />
        </div>
      </header>

      {/* Session warning */}
      <div className="shrink-0 bg-amber-950/40 border-b border-amber-900/40 px-4 py-1.5 flex items-center gap-2">
        <span className="text-amber-500 text-xs">⚠</span>
        <p className="text-xs text-amber-700">
          Work is not saved between sessions. Download your JSON regularly to avoid losing progress.
        </p>
      </div>

      {/* Metadata editor */}
      <MetadataEditor story={story} onChange={patchStory} />

      {/* 3-column workspace */}
      <div className="flex flex-1 min-h-0">

        {/* Left — Path Builder */}
        <aside className="w-64 shrink-0 border-r border-neutral-800 flex flex-col overflow-hidden">
          <PathBuilder
            path={story.path}
            selectedNodeId={selectedNodeId}
            nodeContent={story.nodeContent as Record<string, { blocks: unknown[] }>}
            onSelectNode={handleSelectNode}
            onUpdatePath={updatePath}
          />
        </aside>

        {/* Centre — Node Editor */}
        <main className="flex-1 min-w-0 border-r border-neutral-800 flex flex-col overflow-hidden">
          {!selectedNodeId && (
            <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm text-center px-8">
              <div>
                <p className="text-2xl mb-2">✎</p>
                <p>Select a node from the path<br />to edit its story content.</p>
                {story.path.length === 0 && (
                  <p className="mt-3 text-xs text-neutral-700">Start by adding nodes to the path on the left.</p>
                )}
              </div>
            </div>
          )}

          {selectedNodeId && selectedContent && (
            <NodeEditor
              nodeId={selectedNodeId}
              content={selectedContent}
              onUpdate={c => updateNodeContent(selectedNodeId, c)}
            />
          )}
        </main>

        {/* Right — Stats Library */}
        <aside className="w-64 shrink-0 flex flex-col overflow-hidden">
          <StatsLibrary
            nodeId={selectedNodeId}
            onInsertBlock={insertBlock}
          />
        </aside>
      </div>
    </div>
  );
}

function TopBtn({
  onClick, label, primary = false,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
        primary
          ? 'bg-neutral-200 hover:bg-white text-neutral-900 border-transparent font-medium'
          : 'border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500'
      }`}
    >
      {label}
    </button>
  );
}
