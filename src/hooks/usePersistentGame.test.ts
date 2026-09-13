import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ECONOMY_CONFIG } from '../game/economyConfig'
import { GAME_CONFIG } from '../game/config'
import { createInitialGameState } from '../game/game'
import {
  loadResumableGame,
  savedGameExists,
  saveGame,
  serializeGameState,
  SAVED_GAME_KEY,
} from '../persistence/savedGame'
import { TEST_COUNTRIES } from '../tests/fixtures'
import { createMemoryStorage } from '../tests/memoryStorage'
import { usePersistentGame } from './usePersistentGame'

const selectFirst = () => 0

let memory: ReturnType<typeof createMemoryStorage>

beforeEach(() => {
  memory = createMemoryStorage()
})

function seedSavedGeodes(geodes: number) {
  const state = createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, selectFirst)
  state.player.geodes = geodes
  saveGame(state, memory)
  return state
}

describe('usePersistentGame', () => {
  it('saves a newly started game immediately', () => {
    renderHook(() =>
      usePersistentGame(
        TEST_COUNTRIES,
        GAME_CONFIG,
        selectFirst,
        undefined,
        memory,
      ),
    )

    expect(savedGameExists(memory)).toBe(true)
    const saved = memory.getItem(SAVED_GAME_KEY)
    expect(saved).not.toBeNull()
    expect(JSON.parse(saved ?? '{}').player).toEqual({
      geodes: 1000,
      lives: 3,
    })
  })

  it('persists meaningful game changes such as a clue purchase', async () => {
    const { result } = renderHook(() =>
      usePersistentGame(
        TEST_COUNTRIES,
        GAME_CONFIG,
        selectFirst,
        undefined,
        memory,
      ),
    )

    act(() => {
      result.current.revealClue('capital')
    })

    await waitFor(() => {
      const restored = loadResumableGame(TEST_COUNTRIES, memory)
      expect(restored?.purchasedClueIds).toEqual(['capital'])
      expect(restored?.player.geodes).toBe(750)
    })
  })

  it('keeps a resumed save intact on mount and continues saving changes', async () => {
    const resumed = seedSavedGeodes(1150)
    const { result } = renderHook(() =>
      usePersistentGame(
        TEST_COUNTRIES,
        GAME_CONFIG,
        selectFirst,
        resumed,
        memory,
      ),
    )

    await waitFor(() => {
      expect(loadResumableGame(TEST_COUNTRIES, memory)?.player.geodes).toBe(
        1150,
      )
    })

    act(() => {
      result.current.purchaseLife()
    })

    await waitFor(() => {
      expect(loadResumableGame(TEST_COUNTRIES, memory)?.player.geodes).toBe(400)
    })
  })

  it('clears the saved game once the player runs out of lives', async () => {
    const config = {
      ...GAME_CONFIG,
      economy: { ...ECONOMY_CONFIG, startingLives: 1 },
    }
    const { result } = renderHook(() =>
      usePersistentGame(TEST_COUNTRIES, config, selectFirst, undefined, memory),
    )

    expect(savedGameExists(memory)).toBe(true)

    act(() => {
      result.current.submitGuess('Spain')
    })

    await waitFor(() => {
      expect(savedGameExists(memory)).toBe(false)
    })
  })

  it('restores the exact saved state needed to continue', () => {
    const resumed = seedSavedGeodes(1150)
    const serialized = serializeGameState(resumed)

    const restored = loadResumableGame(TEST_COUNTRIES, memory)

    expect(restored).not.toBeNull()
    expect(restored?.player.geodes).toBe(1150)
    expect(restored?.turn).toBe(serialized.turn)
    expect(restored?.revealedClueIds).toEqual(serialized.revealedClueIds)
    expect(restored?.mysteryCountry.id).toBe(serialized.mysteryCountryId)
  })
})
