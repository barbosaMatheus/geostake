import { GAME_CONFIG, type GameConfig } from '../game/config'
import { guessMatchPercent } from '../game/game'
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
    skipTurn,
    revealClue,
    purchaseLife,
    lastIncorrectGuess,
  } = usePersistentGame(countries, config, random, initialGameState, storage)
  const { player, mysteryCountry, guessResult } = gameState
  const turnResolved = guessResult !== null || player.lives === 0
  const matchPercent =
    guessResult?.outcome === 'correct'
      ? guessMatchPercent(guessResult.guessedName, guessResult.country)
      : null

  return (
    <main className="app game-screen">
      <GameTitle />
      <StatusBar
        player={player}
        turn={gameState.turn}
        economy={config.economy}
        disabled={turnResolved}
        onHome={onExit}
        onBuyLife={purchaseLife}
        onSkip={skipTurn}
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
        matchPercent={matchPercent}
        onNextTurn={startNextTurn}
      />
    </main>
  )
}

export default GameScreen
