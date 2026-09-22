import { useState } from 'react'
import GameScreen from './components/GameScreen'
import LandingScreen from './components/LandingScreen'
import SettingsScreen from './components/SettingsScreen'
import TutorialScreen from './components/TutorialScreen'
import { COUNTRIES } from './data/countries'
import type { AppView } from './navigation/views'
import {
  clearSavedGame,
  loadResumableGame,
  savedGameExists,
} from './persistence/savedGame'
import type { StorageAdapter } from './persistence/storage'
import type { GameState } from './types/game'

interface AppProps {
  storage?: StorageAdapter
}

function App({ storage }: AppProps) {
  const [view, setView] = useState<AppView>('landing')
  const [confirmingNewGame, setConfirmingNewGame] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() =>
    savedGameExists(storage),
  )
  const [initialGameState, setInitialGameState] = useState<GameState | null>(
    null,
  )

  const goToLanding = () => {
    setConfirmingNewGame(false)
    setHasSavedGame(savedGameExists(storage))
    setInitialGameState(null)
    setView('landing')
  }

  const handleNewGame = () => {
    if (savedGameExists(storage)) {
      setConfirmingNewGame(true)
    } else {
      startFreshGame()
    }
  }

  const startFreshGame = () => {
    clearSavedGame(storage)
    setConfirmingNewGame(false)
    setInitialGameState(null)
    setView('game')
  }

  const handleContinueGame = () => {
    const game = loadResumableGame(COUNTRIES, storage)
    if (game === null) {
      setHasSavedGame(false)
      return
    }
    setInitialGameState(game)
    setView('game')
  }

  const handleTutorial = () => {
    setView('tutorial')
  }

  switch (view) {
    case 'game':
      return (
        <GameScreen
          countries={COUNTRIES}
          initialGameState={initialGameState}
          storage={storage}
          onExit={goToLanding}
        />
      )
    case 'tutorial':
      return <TutorialScreen countries={COUNTRIES} onExit={goToLanding} />
    case 'settings':
      return <SettingsScreen onBack={goToLanding} />
    case 'landing':
      return (
        <LandingScreen
          hasSavedGame={hasSavedGame}
          confirmingNewGame={confirmingNewGame}
          onNewGame={handleNewGame}
          onContinueGame={handleContinueGame}
          onConfirmNewGame={startFreshGame}
          onCancelNewGame={() => setConfirmingNewGame(false)}
          onTutorial={handleTutorial}
          onSettings={() => setView('settings')}
        />
      )
  }
}

export default App
