import { useCallback, useEffect, useRef, useState } from 'react'
import { revealClue as applyClueReveal } from '../game/clues'
import { GAME_CONFIG, type GameConfig } from '../game/config'
import { purchaseLife as applyLifePurchase } from '../game/economy'
import {
  createInitialGameState,
  isCorrectGuess,
  resolveGuess,
  startNextTurn as advanceTurn,
} from '../game/game'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { LastIncorrectGuess } from '../types/guess'

export function useGame(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random?: () => number,
) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(countries, config, random),
  )
  const [lastIncorrectGuess, setLastIncorrectGuess] =
    useState<LastIncorrectGuess | null>(null)

  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const submitGuess = useCallback(
    (guessedName: string) => {
      const current = gameStateRef.current
      if (current.guessResult !== null || current.player.lives <= 0) {
        return
      }
      const wasCorrect = isCorrectGuess(guessedName, current.mysteryCountry)
      const next = resolveGuess(current, guessedName, countries, config, random)
      setGameState(next)
      if (wasCorrect || next.player.lives <= 0) {
        setLastIncorrectGuess(null)
      } else {
        setLastIncorrectGuess({
          guessedName,
          livesRemaining: next.player.lives,
        })
      }
    },
    [countries, config, random],
  )

  const revealClue = useCallback((clueId: ClueId) => {
    setGameState((current) => applyClueReveal(current, clueId))
  }, [])

  const startNextTurn = useCallback(() => {
    const current = gameStateRef.current
    if (current.guessResult === null && current.player.lives > 0) {
      return
    }
    setGameState(advanceTurn(current, countries, random, config))
    setLastIncorrectGuess(null)
  }, [countries, config, random])

  const purchaseLife = useCallback(() => {
    setGameState((current) => ({
      ...current,
      player: applyLifePurchase(current.player, config.economy),
    }))
  }, [config])

  return {
    gameState,
    submitGuess,
    startNextTurn,
    revealClue,
    purchaseLife,
    lastIncorrectGuess,
  }
}
