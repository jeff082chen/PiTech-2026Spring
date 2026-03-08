import { useState } from 'react';
import type { View } from './types';
import STORY_NODES from './data/storyNodes';
import LandingPage from './components/LandingPage';
import FlowView from './components/FlowView';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [currentNodeId, setCurrentNodeId] = useState('start');

  const startExperience = () => {
    setCurrentNodeId('start');
    setCurrentView('flow');
  };

  const handleChoice = (nextNodeId: string) => {
    setCurrentNodeId(nextNodeId);
    window.scrollTo(0, 0);
  };

  if (currentView === 'landing') {
    return <LandingPage onStart={startExperience} />;
  }

  return (
    <FlowView
      node={STORY_NODES[currentNodeId]}
      onChoice={handleChoice}
      onBackToHome={() => setCurrentView('landing')}
    />
  );
}
