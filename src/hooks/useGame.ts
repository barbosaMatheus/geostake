import { useCallback, useState } from 'react'
import { revealClue as applyClueReveal } from '../game/clues'
import {
  applyGuess,
  createInitialGameState,
  startNextTurn as advanceTurn,
} from '../game/game'
import { GAME_CONFIG } from '../game/config'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'

export function useGame(countries: readonly Country[], random?: () => number) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(countries, GAME_CONFIG, random),
  )

  const submitGuess = useCallback((guessedName: string) => {
    setGameState((current) => applyGuess(current, guessedName))
  }, [])

  const revealClue = useCallback((clueId: ClueId) => {
    setGameState((current) => applyClueReveal(current, clueId))
  }, [])

  const startNextTurn = useCallback(() => {
    setGameState((current) => advanceTurn(current, countries, random))
  }, [countries, random])

  return { gameState, submitGuess, startNextTurn, revealClue }
}
