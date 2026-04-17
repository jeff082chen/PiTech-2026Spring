import { useState } from 'react';
import type { StoryConfig, StoryCharacter, StoryIntro, StoryEnding } from '../../types';

interface Props {
  story: StoryConfig;
  onChange: (patch: Partial<StoryConfig>) => void;
}

export default function MetadataEditor({ story, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const inputCls = 'w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500';
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = 'block text-xs text-neutral-500 mb-1';

  const ending = story.ending ?? { title: '', description: '', actions: [] };
  const actions = ending.actions ?? [];

  const updateCharacter = (patch: Partial<StoryCharacter>) =>
    onChange({ character: { ...story.character, ...patch } });

  const updateIntro = (patch: Partial<StoryIntro>) =>
    onChange({ intro: { ...story.intro, ...patch } });

  const updateEnding = (patch: Partial<StoryEnding>) =>
    onChange({ ending: { ...ending, ...patch } });

  const addAction = () =>
    updateEnding({ actions: [...actions, ''] });

  const updateAction = (i: number, val: string) => {
    const next = [...actions];
    next[i] = val;
    updateEnding({ actions: next });
  };

  const removeAction = (i: number) =>
    updateEnding({ actions: actions.filter((_, idx) => idx !== i) });

  return (
    <div className="border-b border-neutral-800">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-900 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Story Details
        </span>
        <span className="text-neutral-600 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 bg-neutral-950/30">
          {/* Identity */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider pt-1">Identity</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Story ID</label>
                <input
                  type="text"
                  value={story.id}
                  onChange={e => onChange({ id: e.target.value })}
                  placeholder="e.g. maria"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input
                  type="text"
                  value={story.title}
                  onChange={e => onChange({ title: e.target.value })}
                  placeholder="e.g. Maria's Story"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Character */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Character</p>
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={story.character.name}
                onChange={e => updateCharacter({ name: e.target.value })}
                placeholder="e.g. Maria"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Summary</label>
              <textarea
                rows={3}
                value={story.character.summary}
                onChange={e => updateCharacter({ summary: e.target.value })}
                placeholder="1–2 sentences introducing the character's situation."
                className={textareaCls}
              />
            </div>
          </section>

          {/* Intro */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Intro Screen</p>
            <div>
              <label className={labelCls}>Title</label>
              <input
                type="text"
                value={story.intro.title}
                onChange={e => updateIntro({ title: e.target.value })}
                placeholder="e.g. A Call That Changes Everything"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                value={story.intro.description}
                onChange={e => updateIntro({ description: e.target.value })}
                placeholder="Context shown on the opening screen."
                className={textareaCls}
              />
            </div>
          </section>

          {/* Ending */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Ending Screen</p>
            <div>
              <label className={labelCls}>Title</label>
              <input
                type="text"
                value={ending.title}
                onChange={e => updateEnding({ title: e.target.value })}
                placeholder="e.g. The System Stays"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                value={ending.description}
                onChange={e => updateEnding({ description: e.target.value })}
                placeholder="Closing reflection on the story."
                className={textareaCls}
              />
            </div>

            {/* Call-to-action items */}
            <div>
              <label className={labelCls}>Call-to-action items</label>
              <div className="space-y-1.5">
                {actions.map((action, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      type="text"
                      value={action}
                      onChange={e => updateAction(i, e.target.value)}
                      placeholder={`Action item ${i + 1}`}
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={() => removeAction(i)}
                      className="text-neutral-600 hover:text-red-400 px-2 text-sm transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addAction}
                className="mt-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span> Add item
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
