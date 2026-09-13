import { useEffect, useRef } from 'react'
import { GAME_CONFIG, type GameConfig } from '../game/config'
import { clearSavedGame, saveGame } from '../persistence/savedGame'
import {
  localStorageAdapter,
  type StorageAdapter,
} from '../persistence/storage'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import { useGame } from './useGame'

/**
 * Wraps `useGame` with persistence. Meaningful game-state changes (guesses,
 * clue purchases, life purchases, turn advances, rewards) are written to the
 * configured storage. The saved game is cleared when the current game ends
 * (zero lives). A resumed game (via `initialGameState`) is not re-written on
 * mount, because the save being restored already reflects that state.
 */
export function usePersistentGame(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random?: () => number,
  initialGameState?: GameState | null,
  storage: StorageAdapter = localStorageAdapter,
) {
  const adapterRef = useRef(storage)
  useEffect(() => {
    adapterRef.current = storage
  }, [storage])

  const game = useGame(countries, config, random, initialGameState)

  const mountedRef = useRef(false)
  useEffect(() => {
    const state = game.gameState
    const persist = () => {
      if (state.player.lives === 0) {
        clearSavedGame(adapterRef.current)
      } else {
        saveGame(state, adapterRef.current)
      }
    }
    if (!mountedRef.current) {
      mountedRef.current = true
      if (initialGameState == null) {
        persist()
      }
      return
    }
    persist()
  }, [game.gameState, initialGameState])

  return game
}
