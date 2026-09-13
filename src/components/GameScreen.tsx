import { GAME_CONFIG, type GameConfig } from '../game/config'
import { usePersistentGame } from '../hooks/usePersistentGame'
import type { StorageAdapter } from '../persistence/storage'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import CluePanel from './CluePanel'
import GameTitle from './GameTitle'
import GuessFeedback from './GuessFeedback'
import GuessForm from './GuessForm'
import MysteryCountry from './MysteryCountry'
import StatusBar from './StatusBar'

interface GameScreenProps {
  countries: readonly Country[]
  config?: GameConfig
  random?: () => number
  onExit?: () => void
  initialGameState?: GameState | null
  storage?: StorageAdapter
}

function GameScreen({
  countries,
  config = GAME_CONFIG,
  random,
  onExit,
  initialGameState,
  storage,
}: GameScreenProps) {
  const {
    gameState,
    submitGuess,
    startNextTurn,
    revealClue,
    purchaseLife,
    lastIncorrectGuess,
  } = usePersistentGame(countries, config, random, initialGameState, storage)
  const { player, mysteryCountry, guessResult } = gameState
  const turnResolved = guessResult !== null || player.lives === 0

  return (
    <main className="app">
      {onExit && (
        <div className="game-nav">
          <button className="button-secondary" type="button" onClick={onExit}>
            Back to Landing
          </button>
        </div>
      )}
      <GameTitle />
      <StatusBar
        player={player}
        turn={gameState.turn}
        economy={config.economy}
        disabled={turnResolved}
        onBuyLife={purchaseLife}
      />
      <MysteryCountry
        country={mysteryCountry}
        revealed={guessResult?.outcome === 'correct'}
      />
      <CluePanel
        country={mysteryCountry}
        geodes={player.geodes}
        startingClueId={gameState.startingClueId}
        revealedClueIds={gameState.revealedClueIds}
        disabled={turnResolved}
        onReveal={revealClue}
      />
      <GuessForm disabled={turnResolved} onSubmit={submitGuess} />
      <GuessFeedback
        guessResult={guessResult}
        lastIncorrectGuess={lastIncorrectGuess}
        lives={player.lives}
        countryName={mysteryCountry.name}
        onNextTurn={startNextTurn}
      />
    </main>
  )
}

export default GameScreen
