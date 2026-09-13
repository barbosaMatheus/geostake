import { useState } from 'react'
import GameScreen from './components/GameScreen'
import LandingScreen from './components/LandingScreen'
import SettingsScreen from './components/SettingsScreen'
import { COUNTRIES } from './data/countries'
import type { AppView } from './navigation/views'

function App() {
  const [view, setView] = useState<AppView>('landing')

  switch (view) {
    case 'game':
      return (
        <GameScreen countries={COUNTRIES} onExit={() => setView('landing')} />
      )
    case 'settings':
      return <SettingsScreen onBack={() => setView('landing')} />
    case 'landing':
      return (
        <LandingScreen
          onNewGame={() => setView('game')}
          onSettings={() => setView('settings')}
        />
      )
  }
}

export default App
