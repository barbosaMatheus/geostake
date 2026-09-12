import { useGame } from '../hooks/useGame'
import type { Country } from '../types/country'
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
  const { gameState, submitGuess, startNextTurn } = useGame(countries, random)
  const { player, mysteryCountry, guessResult } = gameState

  return (
    <main className="app">
      <GameTitle />
      <StatusBar player={player} />
      <MysteryCountry
        country={mysteryCountry}
        revealed={guessResult?.outcome === 'correct'}
      />
      <GuessForm disabled={guessResult !== null} onSubmit={submitGuess} />
      <GuessFeedback guessResult={guessResult} onNextTurn={startNextTurn} />
    </main>
  )
}

export default GameScreen
