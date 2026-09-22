import { useState } from 'react'
import { GAME_CONFIG, type GameConfig } from '../game/config'
import { guessMatchPercent } from '../game/game'
import { useTutorial } from '../hooks/useTutorial'
import type { Country } from '../types/country'
import CluePanel from './CluePanel'
import GameTitle from './GameTitle'
import GuessFeedback from './GuessFeedback'
import GuessForm from './GuessForm'
import HelpOverlay from './HelpOverlay'
import MysteryCountry from './MysteryCountry'
import StatusBar from './StatusBar'

interface TutorialScreenProps {
  countries: readonly Country[]
  config?: GameConfig
  random?: () => number
  onExit?: () => void
}

function TutorialScreen({
  countries,
  config = GAME_CONFIG,
  random,
  onExit,
}: TutorialScreenProps) {
  const {
    tutorialState,
    submitGuess,
    revealClue,
    purchaseLife,
    reset,
    lastIncorrectGuess,
  } = useTutorial(countries, config, random)
  const [helpOpen, setHelpOpen] = useState(false)
  const { game } = tutorialState
  const { player, mysteryCountry, guessResult } = game
  const turnResolved = guessResult !== null || player.lives === 0
  const matchPercent =
    guessResult?.outcome === 'correct'
      ? guessMatchPercent(guessResult.guessedName, guessResult.country)
      : null

  return (
    <main className="app game-screen">
      <GameTitle onHelp={() => setHelpOpen(true)} />
      <StatusBar
        player={player}
        turn={game.turn}
        economy={config.economy}
        disabled={turnResolved}
        onHome={onExit}
        onBuyLife={purchaseLife}
      />
      <MysteryCountry
        country={mysteryCountry}
        revealed={guessResult?.outcome === 'correct'}
      />
      <CluePanel
        country={mysteryCountry}
        geodes={player.geodes}
        startingClueId={game.startingClueId}
        revealedClueIds={game.revealedClueIds}
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
        onNextTurn={reset}
      />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  )
}

export default TutorialScreen