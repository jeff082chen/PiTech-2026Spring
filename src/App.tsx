import { useState } from 'react';
import StoryPage from './components/StoryPage';
import MapView from './components/MapView';
import type { StoryConfig } from './types';
import mariaJson from './data/stories/maria.json';

const MARIA_STORY = mariaJson as StoryConfig;

type View = 'story' | 'map';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('story');

  if (currentView === 'map') {
    return <MapView onBackToLanding={() => setCurrentView('story')} />;
  }

  return (
    <StoryPage
      storyConfig={MARIA_STORY}
      onExploreMap={() => setCurrentView('map')}
    />
  );
}
