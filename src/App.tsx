import { useState } from 'react';
import StoryPage    from './components/StoryPage';
import MapView      from './components/MapView';
import StoryBuilder from './components/builder/StoryBuilder';
import type { StoryConfig } from './types';
import mariaJson from './data/stories/maria.json';

const MARIA_STORY = mariaJson as StoryConfig;

type View = 'story' | 'map' | 'builder';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('story');

  if (currentView === 'builder') {
    return <StoryBuilder onExit={() => setCurrentView('story')} />;
  }

  if (currentView === 'map') {
    return <MapView onBackToLanding={() => setCurrentView('story')} />;
  }

  return (
    <>
      <StoryPage
        storyConfig={MARIA_STORY}
        onExploreMap={() => setCurrentView('map')}
      />
      {/* Internal tool access — not surfaced in the public UI */}
      <button
        onClick={() => setCurrentView('builder')}
        className="fixed bottom-4 right-4 z-[9999] bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 text-xs px-3 py-1.5 rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors shadow-lg"
        title="Open Story Builder (internal tool)"
      >
        Story Builder
      </button>
    </>
  );
}
