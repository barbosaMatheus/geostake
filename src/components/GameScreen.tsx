import { useGame } from '../hooks/useGame'
import type { Country } from '../types/country'
import CluePanel from './CluePanel'
import GameTitle from './GameTitle'
import GuessFeedback from './GuessFeedback'
import GuessForm from './GuessForm'
import MysteryCountry from './MysteryCountry'
import StatusBar from './StatusBar'

interface GameScreenProps {
  countries: readonly Country[]
  random?: () => number
}

function GameScreen({ countries, random }: GameScreenProps) {
  const { gameState, submitGuess, startNextTurn, revealClue } = useGame(
    countries,
    random,
  )
  const { player, mysteryCountry, guessResult } = gameState

  return (
    <main className="app">
      <GameTitle />
      <StatusBar player={player} />
      <MysteryCountry
        country={mysteryCountry}
        revealed={guessResult?.outcome === 'correct'}
      />
      <CluePanel
        country={mysteryCountry}
        geodes={player.geodes}
        startingClueId={gameState.startingClueId}
        revealedClueIds={gameState.revealedClueIds}
        onReveal={revealClue}
      />
      <GuessForm disabled={guessResult !== null} onSubmit={submitGuess} />
      <GuessFeedback guessResult={guessResult} onNextTurn={startNextTurn} />
    </main>
  )
}

export default GameScreen
