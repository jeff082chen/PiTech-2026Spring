import { useState } from 'react';
import LandingPage from './components/LandingPage';
import MapView from './components/MapView';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'map'>('landing');

  if (currentView === 'landing') {
    return <LandingPage onStart={() => setCurrentView('map')} />;
  }

  return <MapView onBackToLanding={() => setCurrentView('landing')} />;
}
