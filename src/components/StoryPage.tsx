import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Map, ChevronDown } from 'lucide-react';
import STORY_NODES, { EDGES } from '../data/storyNodes';
import type { StoryConfig, StoryContentBlock } from '../types';
import { CANVAS_W, CANVAS_H, MOBILE_BREAKPOINT } from '../config/constants';
import { BORDER_COLOR, CATEGORY_LABEL, CATEGORY_LEFT_BORDER } from '../config/categoryStyles';

// ─── Animation & layout config ────────────────────────────────────────────────
// All scroll pacing, camera, transition, and layout parameters live here.
// No need to hunt through JSX — adjust once, affects the whole experience.

const SCROLL_CONFIG = {
  // Phase height multipliers (× viewport height).
  // Larger value = more scroll distance = slower feel for that phase.
  phaseHeights: {
    hero:     1.5,
    overview: 1.0,
    focus:    1.0,
    story:    1.2,
    stat:     1.0,
    ending:   1.2,
  },

  // Camera zoom levels for the flowchart canvas.
  cam: {
    overviewFit: 0.88,  // fraction of viewport filled by the overview
    focusScale:  0.48,  // canvas scale when zoomed in on a node
    storyScale:  0.60,  // canvas scale when story card is visible
  },

  // Dark overlay opacity per phase (0 = transparent, 1 = fully opaque).
  overlay: {
    hero:       0.92,
    overview:   0.06,
    focusStart: 0.12,  // opacity at start of node-focus phase (lerps → focusEnd)
    focusEnd:   0.55,  // opacity at end of node-focus phase
    story:      0.82,
    stat:       0.80,
    ending:     0.95,
  },

  // CSS transition strings for UI elements (NOT the scroll-driven canvas camera).
  // Increase duration to slow a given animation; use different easing to reshape feel.
  transitions: {
    overlay:     '600ms ease',
    screenFade:  '600ms ease',
    focusHint:   '400ms ease',
    cardSlide:   '500ms cubic-bezier(0.25,1,0.5,1)',
    statOpacity: '400ms ease',
    statSlide:   '500ms cubic-bezier(0.25,1,0.5,1)',
    progressBar: '500ms ease-out',
  },

  // Delay (ms) before node-focus hint appears — avoids collision with fading content.
  focusHintDelayMs: 150,

  // Card and stat panel geometry (desktop fractions of viewport width).
  layout: {
    cardMaxPx:         540,   // max card width in px (desktop)
    cardFraction:      0.46,  // card width as fraction of vw (desktop)
    cardMobileFrac:    0.9,   // card width as fraction of vw (mobile)
    statFraction:      0.44,  // stat panel width as fraction of vw (desktop)
    statMobileFrac:    0.9,   // stat panel width as fraction of vw (mobile)
    cardStatLeftFrac:  0.03,  // card left edge fraction when stat panel is visible
    statPanelLeftFrac: 0.50,  // stat panel left edge fraction
    statPanelGapPx:    16,    // px gap added to stat panel left edge
    statSlideOffset:   '3rem', // hidden-state translateX offset for stat panel
  },
} as const;

// ─── Camera keyframe ──────────────────────────────────────────────────────────
// nodeId: null → fit entire canvas; scale: 0 means "compute fit-to-viewport"

interface CameraKF {
  nodeId: string | null;
  scale: number; // 0 = overview (fit-to-viewport)
}

const OVERVIEW_KF: CameraKF = { nodeId: null, scale: 0 };

function resolveCam(kf: CameraKF, vw: number, vh: number): { tx: number; ty: number; scale: number } {
  if (kf.nodeId === null || kf.scale === 0) {
    const scale = Math.min(vw / CANVAS_W, vh / CANVAS_H) * SCROLL_CONFIG.cam.overviewFit;
    return { tx: (vw - CANVAS_W * scale) / 2, ty: (vh - CANVAS_H * scale) / 2, scale };
  }
  const node = STORY_NODES[kf.nodeId];
  return {
    tx: vw * 0.5 - node.x * kf.scale,
    ty: vh * 0.5 - node.y * kf.scale,
    scale: kf.scale,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ─── Phase union ──────────────────────────────────────────────────────────────

type Phase = {
  startY: number;
  height: number;
  camStart: CameraKF;
  camEnd:   CameraKF;
} & (
  | { type: 'hero' }
  | { type: 'overview' }
  | { type: 'node-focus'; nodeId: string }
  | { type: 'node-story'; nodeId: string }
  | { type: 'node-stat';  nodeId: string; statIndex: number }
  | { type: 'ending' }
);

function buildPhases(storyConfig: StoryConfig, vh: number): Phase[] {
  const phases: Phase[] = [];
  let y = 0;
  let prevCamEnd: CameraKF = OVERVIEW_KF;
  const { phaseHeights, cam } = SCROLL_CONFIG;

  function push(p: Phase) {
    phases.push(p);
    y += p.height;
    prevCamEnd = p.camEnd;
  }

  const h = (k: keyof typeof phaseHeights) => Math.round(phaseHeights[k] * vh);

  push({ type: 'hero',     startY: y, height: h('hero'),     camStart: OVERVIEW_KF, camEnd: OVERVIEW_KF });
  push({ type: 'overview', startY: y, height: h('overview'), camStart: OVERVIEW_KF, camEnd: OVERVIEW_KF });

  for (const nodeId of storyConfig.path) {
    const statCount = STORY_NODES[nodeId]?.statistics?.length ?? 0;
    const focusKF: CameraKF = { nodeId, scale: cam.focusScale };
    const storyKF: CameraKF = { nodeId, scale: cam.storyScale };

    push({ type: 'node-focus', nodeId, startY: y, height: h('focus'), camStart: prevCamEnd, camEnd: focusKF });
    push({ type: 'node-story', nodeId, startY: y, height: h('story'), camStart: focusKF,    camEnd: storyKF });

    for (let i = 0; i < statCount; i++) {
      push({ type: 'node-stat', nodeId, statIndex: i, startY: y, height: h('stat'), camStart: storyKF, camEnd: storyKF });
    }
  }

  if (storyConfig.ending) {
    push({ type: 'ending', startY: y, height: h('ending'), camStart: prevCamEnd, camEnd: OVERVIEW_KF });
  }

  return phases;
}


// ─── Block renderer ───────────────────────────────────────────────────────────

function renderBlock(block: StoryContentBlock, index: number) {
  switch (block.type) {
    case 'text':
      return (
        <div key={index} className="space-y-1">
          {block.title && <h3 className="text-lg font-bold text-neutral-100 leading-snug">{block.title}</h3>}
          <p className="text-neutral-300 leading-relaxed text-sm">{block.body}</p>
        </div>
      );
    case 'quote':
      return (
        <blockquote key={index} className="border-l-2 border-red-500 pl-4 space-y-1">
          <p className="italic text-neutral-200 text-sm leading-relaxed">"{block.text}"</p>
          {block.attribution && <footer className="text-neutral-500 text-xs not-italic">— {block.attribution}</footer>}
        </blockquote>
      );
    case 'callout':
      return (
        <div key={index} className="border-l-4 border-amber-400 bg-amber-950/30 px-3 py-2 rounded-r-lg text-amber-200 text-xs leading-relaxed">
          {block.text}
        </div>
      );
    case 'image':
      return (
        <figure key={index} className="space-y-1">
          {block.src
            ? <img src={block.src} alt={block.alt ?? ''} className="w-full rounded-xl object-cover" />
            : <div className="w-full h-28 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center text-neutral-600 text-xs">[Image]</div>
          }
          {block.caption && <figcaption className="text-neutral-500 text-xs italic">{block.caption}</figcaption>}
        </figure>
      );
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  storyConfig: StoryConfig;
  onExploreMap: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoryPage({ storyConfig, onExploreMap }: Props) {
  const [scrollY, setScrollY]               = useState(0);
  const [vw, setVw]                         = useState(window.innerWidth);
  const [vh, setVh]                         = useState(window.innerHeight);
  const [showFocusHint, setShowFocusHint]   = useState(false);

  // RAF-throttled scroll
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const phases      = useMemo(() => buildPhases(storyConfig, vh), [storyConfig, vh]);
  const totalHeight = phases[phases.length - 1].startY + phases[phases.length - 1].height;

  // Active phase
  const phaseIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < phases.length; i++) {
      if (scrollY >= phases[i].startY) idx = i;
    }
    return idx;
  }, [scrollY, phases]);

  const phase     = phases[phaseIndex];
  const phaseType = phase.type;

  // Progress within current phase [0, 1]
  const t  = phase.height > 0 ? Math.max(0, Math.min(1, (scrollY - phase.startY) / phase.height)) : 1;
  const te = easeInOut(t);

  // ── Scroll-driven camera (NO CSS transition on canvas) ──────────────────
  const cameraTransform = useMemo(() => {
    const from  = resolveCam(phase.camStart, vw, vh);
    const to    = resolveCam(phase.camEnd,   vw, vh);
    const tx    = lerp(from.tx,    to.tx,    te);
    const ty    = lerp(from.ty,    to.ty,    te);
    const scale = lerp(from.scale, to.scale, te);
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [phase, te, vw, vh]);

  // Derived state
  const cameraNodeId =
    phase.type === 'node-focus' || phase.type === 'node-story' || phase.type === 'node-stat'
      ? phase.nodeId : null;

  const isStat      = phaseType === 'node-stat';
  const showContent = phaseType === 'node-story' || phaseType === 'node-stat';
  const isMobile    = vw < MOBILE_BREAKPOINT;

  const currentStatIndex = phase.type === 'node-stat' ? phase.statIndex : -1;

  // Focus hint: delayed to avoid overlap with fading content
  const focusNodeId = phase.type === 'node-focus' ? phase.nodeId : null;
  useEffect(() => {
    if (phaseType !== 'node-focus') { setShowFocusHint(false); return; }
    setShowFocusHint(false);
    const timer = setTimeout(() => setShowFocusHint(true), SCROLL_CONFIG.focusHintDelayMs);
    return () => clearTimeout(timer);
  }, [phaseType, focusNodeId]);

  // Overlay opacity
  const { overlay } = SCROLL_CONFIG;
  const overlayOpacity =
    phaseType === 'hero'       ? overlay.hero :
    phaseType === 'overview'   ? overlay.overview :
    phaseType === 'node-focus' ? lerp(overlay.focusStart, overlay.focusEnd, te) :
    phaseType === 'node-story' ? overlay.story :
    phaseType === 'node-stat'  ? overlay.stat :
    phaseType === 'ending'     ? overlay.ending : 0.5;

  // Progress bar
  const progressPct = phases.length > 1 ? (phaseIndex / (phases.length - 1)) * 100 : 0;

  // Node highlight sets
  const pathSet = useMemo(() => new Set(storyConfig.path), [storyConfig.path]);
  const currentPathIndex = cameraNodeId ? storyConfig.path.indexOf(cameraNodeId) : -1;
  const visitedSet = useMemo(
    () => new Set(storyConfig.path.slice(0, Math.max(0, currentPathIndex))),
    [storyConfig.path, currentPathIndex],
  );

  // Active node data
  const activeNode   = cameraNodeId ? STORY_NODES[cameraNodeId] : null;
  const storyContent = cameraNodeId ? storyConfig.nodeContent[cameraNodeId] : null;
  const currentStat  = phase.type === 'node-stat' && activeNode?.statistics
    ? activeNode.statistics[phase.statIndex] : null;

  // ── Fixed-width story card layout ─────────────────────────────────────────
  // Card is always the same width — only `left` changes (no text reflow).
  const { layout, transitions } = SCROLL_CONFIG;
  const CARD_W = isMobile ? vw * layout.cardMobileFrac : Math.min(layout.cardMaxPx, vw * layout.cardFraction);
  const STAT_W = isMobile ? vw * layout.statMobileFrac : vw * layout.statFraction;

  const cardLeft = !isMobile && isStat
    ? vw * layout.cardStatLeftFrac
    : (vw - CARD_W) / 2;

  const statLeft   = vw * layout.statPanelLeftFrac + layout.statPanelGapPx;
  const statVisible = isStat && !isMobile;

  return (
    <div style={{ height: totalHeight }} className="relative bg-neutral-950">

      {/* ── Sticky viewport ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden">

        {/* ── Layer 1: Flowchart canvas — scroll-driven, NO CSS transition ──── */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: CANVAS_W, height: CANVAS_H, transform: cameraTransform }}
        >
          <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {EDGES.map((edge, i) => {
              const n1 = STORY_NODES[edge.from];
              const n2 = STORY_NODES[edge.to];
              const onPath = pathSet.has(edge.from) && pathSet.has(edge.to);
              const d = `M ${n1.x} ${n1.y} C ${n1.x + 200} ${n1.y}, ${n2.x - 200} ${n2.y}, ${n2.x} ${n2.y}`;
              return (
                <path key={i} d={d} fill="none"
                  stroke={onPath ? '#ef4444' : '#374151'}
                  strokeWidth={onPath ? 3 : 2}
                  opacity={onPath ? 0.8 : 0.3}
                />
              );
            })}
          </svg>

          {Object.values(STORY_NODES).map(node => {
            const isActive  = node.id === cameraNodeId;
            const isVisited = visitedSet.has(node.id);
            const onPath    = pathSet.has(node.id);
            const stateClass =
              isActive  ? 'opacity-100 scale-110 ring-4 ring-red-500/60 shadow-2xl shadow-red-900/30' :
              isVisited ? 'opacity-35' :
              onPath    ? 'opacity-60' :
                          'opacity-15 grayscale';
            return (
              <div key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: node.x, top: node.y, width: 260 }}
              >
                <div className={[
                  'flex flex-col items-center justify-center p-4',
                  'bg-neutral-800/80 rounded-2xl border-2 shadow-lg transition-all duration-500',
                  BORDER_COLOR[node.category], stateClass,
                ].join(' ')}>
                  <div className="mb-2">{node.icon}</div>
                  <h3 className="text-sm font-bold text-neutral-100 text-center leading-tight">{node.title}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Layer 2: Dark overlay ─────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-neutral-950 pointer-events-none"
          style={{ opacity: overlayOpacity, transition: `opacity ${transitions.overlay}` }}
        />

        {/* ── Layer 3: Hero screen ──────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-hidden"
          style={{
            opacity: phaseType === 'hero' ? 1 : 0,
            transition: `opacity ${transitions.screenFade}`,
            pointerEvents: phaseType === 'hero' ? 'auto' : 'none',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)' }}
          />
          <div className="relative text-center max-w-3xl space-y-5 z-10">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{storyConfig.intro.title}</p>
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest -mt-2">The Bronx Defenders × PiTech</p>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-none">{storyConfig.character.name}</h1>
            <div className="w-16 h-1 bg-red-500 mx-auto rounded-full" />
            <p className="text-neutral-300 text-xl leading-relaxed max-w-2xl mx-auto">{storyConfig.character.summary}</p>
            <p className="text-neutral-500 text-sm max-w-xl mx-auto">{storyConfig.intro.description}</p>
            <div className="flex flex-col items-center gap-2 text-neutral-600 text-sm pt-4 animate-bounce">
              <span>Scroll to begin</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ── Layer 4: Overview label ───────────────────────────────────────── */}
        <div
          className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: phaseType === 'overview' ? 1 : 0, transition: `opacity ${transitions.screenFade}` }}
        >
          <p className="text-neutral-300 text-sm font-bold uppercase tracking-widest">{storyConfig.intro.title}</p>
          <p className="text-neutral-600 text-xs">The system {storyConfig.character.name} will navigate</p>
          <ChevronDown className="w-4 h-4 text-neutral-600 animate-bounce mt-1" />
        </div>

        {/* ── Layer 5: Node-focus hint ──────────────────────────────────────── */}
        <div
          className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: showFocusHint ? 1 : 0, transition: `opacity ${transitions.focusHint}` }}
        >
          {activeNode && (
            <>
              <p className="text-neutral-500 text-xs tracking-widest uppercase">
                {storyConfig.path.indexOf(activeNode.id) + 1} of {storyConfig.path.length}
              </p>
              <span className={`text-sm font-bold ${CATEGORY_LABEL[activeNode.category]}`}>{activeNode.title}</span>
              <ChevronDown className="w-4 h-4 text-neutral-600 animate-bounce" />
            </>
          )}
        </div>

        {/* ── Layer 6: Story card (fixed width, translates left on stat phase) */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            opacity: showContent ? 1 : 0,
            transition: `opacity ${transitions.screenFade}`,
          }}
        >
          {/* Story card — fixed width, slides left */}
          <div
            className="absolute top-0 bottom-0 flex flex-col justify-center overflow-hidden"
            style={{
              width: CARD_W,
              left: cardLeft,
              transition: `left ${transitions.cardSlide}`,
              pointerEvents: showContent ? 'auto' : 'none',
            }}
          >
            <div
              className="py-20 px-6"
              style={{ maxHeight: '100vh', overflowY: 'auto' }}
            >
              {activeNode && storyContent && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 text-xs font-mono">
                      {storyConfig.path.indexOf(activeNode.id) + 1} / {storyConfig.path.length}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${CATEGORY_LABEL[activeNode.category]}`}>
                      {activeNode.category}
                    </span>
                  </div>
                  <div className={`border-l-4 pl-4 ${CATEGORY_LEFT_BORDER[activeNode.category]}`}>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">System stage</p>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-100 leading-tight">{activeNode.title}</h2>
                  </div>
                  {storyContent.blocks.length > 0 && (
                    <div className="space-y-3">
                      {storyContent.blocks.map((block, i) => renderBlock(block, i))}
                    </div>
                  )}
                  <div className="border border-neutral-800 bg-neutral-800/20 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">How the system works</p>
                    <p className="text-neutral-500 text-xs leading-relaxed">{activeNode.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stat panel — slides in from right (desktop only) */}
          {!isMobile && (
            <div
              className="absolute top-0 bottom-0 flex flex-col justify-center py-20 px-6 overflow-y-auto"
              style={{
                width: STAT_W,
                left: statLeft,
                opacity: statVisible ? 1 : 0,
                transform: statVisible ? 'translateX(0)' : `translateX(${layout.statSlideOffset})`,
                transition: `opacity ${transitions.statOpacity}, transform ${transitions.statSlide}`,
                pointerEvents: statVisible ? 'auto' : 'none',
              }}
            >
              {currentStat && (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">System Data</p>
                  <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-5">
                    {currentStat.component}
                    {currentStat.sources.length > 0 && (
                      <p className="text-xs text-neutral-600 mt-4 pt-3 border-t border-neutral-700/50 leading-relaxed">
                        {currentStat.sources
                          .map<ReactNode>((s, i) =>
                            s.url
                              ? <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                   className="underline underline-offset-2 hover:text-neutral-400">{s.label}</a>
                              : <span key={i}>{s.label}</span>
                          )
                          .reduce<ReactNode[]>((acc, el, i) =>
                            i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-neutral-700"> · </span>, el],
                            []
                          )}
                      </p>
                    )}
                  </div>
                  {activeNode?.statistics && activeNode.statistics.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {activeNode.statistics.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                          i === currentStatIndex ? 'bg-neutral-300' : 'bg-neutral-600'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile stat panel — stacked below story */}
          {isMobile && isStat && (
            <div
              className="absolute left-0 right-0 flex flex-col px-5 pb-4 overflow-y-auto"
              style={{ top: '52%', bottom: 0, pointerEvents: 'auto' }}
            >
              {currentStat && (
                <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-4">
                  {currentStat.component}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Layer 7: Ending screen ────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-y-auto"
          style={{
            opacity: phaseType === 'ending' ? 1 : 0,
            transition: `opacity ${transitions.screenFade}`,
            pointerEvents: phaseType === 'ending' ? 'auto' : 'none',
          }}
        >
          {storyConfig.ending && (
            <div className="max-w-2xl w-full space-y-8 py-20">
              <div>
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4">End of Story</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-100 leading-tight">{storyConfig.ending.title}</h2>
                <div className="w-12 h-1 bg-red-500 mt-4 rounded-full" />
              </div>
              <p className="text-neutral-300 text-lg leading-relaxed">{storyConfig.ending.description}</p>
              {storyConfig.ending.actions && storyConfig.ending.actions.length > 0 && (
                <div className="border border-neutral-800 rounded-2xl p-6 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">What Can Be Done</p>
                  <div className="space-y-3">
                    {storyConfig.ending.actions.map(action => (
                      <div key={action} className="flex gap-3 text-sm text-neutral-400">
                        <span className="text-red-500 shrink-0 mt-0.5">→</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-neutral-700 text-neutral-400 rounded-full text-sm font-semibold hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                >
                  ← Read again
                </button>
                <button
                  onClick={onExploreMap}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-full text-sm font-semibold hover:bg-neutral-700 transition-colors"
                >
                  <Map className="w-4 h-4" />
                  Explore Full Map
                </button>
              </div>
              <p className="text-neutral-700 text-xs">Data last updated: 2024</p>
            </div>
          )}
        </div>

        {/* ── Layer 8: Nav + progress bar ───────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="h-0.5 bg-red-500" style={{ width: `${progressPct}%`, transition: `width ${transitions.progressBar}` }} />
          <div className="flex justify-between items-center px-5 py-3 pointer-events-auto">
            <span className="text-neutral-600 text-xs font-bold tracking-widest uppercase select-none">
              The Family Policing Machine
            </span>
            <button
              onClick={onExploreMap}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-100 text-sm font-semibold transition-colors group"
            >
              <Map className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              <span>Explore Full Map</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
