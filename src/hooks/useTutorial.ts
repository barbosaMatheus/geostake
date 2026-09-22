import { useCallback, useEffect, useRef, useState } from 'react'
import { revealClue as applyClueReveal } from '../game/clues'
import { GAME_CONFIG, type GameConfig } from '../game/config'
import { purchaseLife as applyLifePurchase } from '../game/economy'
import { applyGuess, isCorrectGuess } from '../game/game'
import { createTutorialState } from '../game/tutorial'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import type { LastIncorrectGuess } from '../types/guess'
import type { TutorialState } from '../types/tutorial'

/**
 * Owns the isolated tutorial state. Tutorial progress lives only in local
 * component state: it is never written to storage, never saved through the
 * saved-game pipeline, and never shared with the regular game. Guessing, clue
 * reveals, and life purchases behave exactly like the regular game; the
 * tutorial simply always targets Brazil and `reset` returns it to a brand-new
 * starting state.
 */
export function useTutorial(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random?: () => number,
) {
  const [tutorialState, setTutorialState] = useState<TutorialState>(() =>
    createTutorialState(countries, config, random),
  )
  const [lastIncorrectGuess, setLastIncorrectGuess] =
    useState<LastIncorrectGuess | null>(null)

  const tutorialStateRef = useRef(tutorialState)
  useEffect(() => {
    tutorialStateRef.current = tutorialState
  }, [tutorialState])

  const submitGuess = useCallback(
    (guessedName: string) => {
      const current = tutorialStateRef.current
      if (current.game.guessResult !== null || current.game.player.lives <= 0) {
        return
      }
      const wasCorrect = isCorrectGuess(guessedName, current.game.mysteryCountry)
      const next: TutorialState = {
        game: applyGuess(current.game, guessedName, config.economy),
      }
      setTutorialState(next)
      if (wasCorrect || next.game.player.lives <= 0) {
        setLastIncorrectGuess(null)
      } else {
        setLastIncorrectGuess({
          guessedName,
          livesRemaining: next.game.player.lives,
        })
      }
    },
    [config],
  )

  const revealClue = useCallback((clueId: ClueId) => {
    setTutorialState((current) => ({
      game: applyClueReveal(current.game, clueId),
    }))
  }, [])

  const purchaseLife = useCallback(() => {
    setTutorialState((current) => ({
      game: {
        ...current.game,
        player: applyLifePurchase(current.game.player, config.economy),
      },
    }))
  }, [config])

  const reset = useCallback(() => {
    setTutorialState(createTutorialState(countries, config, random))
    setLastIncorrectGuess(null)
  }, [countries, config, random])

  return {
    tutorialState,
    submitGuess,
    revealClue,
    purchaseLife,
    reset,
    lastIncorrectGuess,
  }
}