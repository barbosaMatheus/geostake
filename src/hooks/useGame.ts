import { useCallback, useState } from 'react'
import { revealClue as applyClueReveal } from '../game/clues'
import {
  createInitialGameState,
  resolveGuess,
  startNextTurn as advanceTurn,
} from '../game/game'
import { GAME_CONFIG, type GameConfig } from '../game/config'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'

export function useGame(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random?: () => number,
) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(countries, config, random),
  )

  const submitGuess = useCallback(
    (guessedName: string) => {
      setGameState((current) =>
        resolveGuess(current, guessedName, countries, config, random),
      )
    },
    [countries, config, random],
  )

  const revealClue = useCallback((clueId: ClueId) => {
    setGameState((current) => applyClueReveal(current, clueId))
  }, [])

  const startNextTurn = useCallback(() => {
    setGameState((current) => advanceTurn(current, countries, random))
  }, [countries, random])

  return { gameState, submitGuess, startNextTurn, revealClue }
}
