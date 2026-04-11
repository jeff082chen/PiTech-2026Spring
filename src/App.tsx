import { useState } from 'react';
import StoryPage from './components/StoryPage';
import MapView from './components/MapView';
import { MARIA_STORY } from './data/mariaStory';

// LandingPage is deprecated — its visual content has been migrated to
// src/data/statistics.tsx. StoryPage is now the main entry experience.

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
