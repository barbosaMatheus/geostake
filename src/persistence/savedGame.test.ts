import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/game'
import { TEST_COUNTRIES } from '../tests/fixtures'
import { createMemoryStorage } from '../tests/memoryStorage'
import type { StorageAdapter } from './storage'
import {
  SAVED_GAME_KEY,
  SAVED_GAME_VERSION,
  clearSavedGame,
  isSavedGameState,
  loadResumableGame,
  loadSavedGame,
  restoreGameState,
  savedGameExists,
  saveGame,
  serializeGameState,
} from './savedGame'

const selectFirst = () => 0

function makeGameState() {
  return createInitialGameState(TEST_COUNTRIES, undefined, selectFirst)
}

function makeSavedState() {
  return serializeGameState(makeGameState())
}

function seedStored(state: unknown, storage: StorageAdapter) {
  storage.setItem(SAVED_GAME_KEY, JSON.stringify(state))
}

describe('serializeGameState', () => {
  it('turns a game state into a versioned saved shape with country ids', () => {
    const saved = makeSavedState()

    expect(saved.version).toBe(SAVED_GAME_VERSION)
    expect(saved.mysteryCountryId).toBe('br')
    expect(saved.player).toEqual({ geodes: 1000, lives: 3 })
    expect(saved.turn).toBe(1)
    expect(saved.revealedClueIds).toContain(saved.startingClueId)
    expect(saved.purchasedClueIds).toEqual([])
    expect(saved.guessResult).toBeNull()
    expect(isSavedGameState(saved)).toBe(true)
  })
})

describe('restoreGameState', () => {
  it('restores a saved game from country ids', () => {
    const state = makeGameState()
    const saved = serializeGameState(state)

    const restored = restoreGameState(saved, TEST_COUNTRIES)

    expect(restored).not.toBeNull()
    expect(restored?.player).toEqual(state.player)
    expect(restored?.turn).toBe(state.turn)
    expect(restored?.mysteryCountry.id).toBe('br')
    expect(restored?.mysteryCountry.name).toBe('Brazil')
    expect(restored?.revealedClueIds).toEqual(state.revealedClueIds)
    expect(restored?.purchasedClueIds).toEqual(state.purchasedClueIds)
  })

  it('returns null when the mystery country is unknown', () => {
    const saved = makeSavedState()

    expect(restoreGameState(saved, [])).toBeNull()

    const foreignCountries = [{ ...TEST_COUNTRIES[0], id: 'zz' }]
    expect(restoreGameState(saved, foreignCountries)).toBeNull()
  })
})

describe('saveGame / loadSavedGame / savedGameExists', () => {
  it('saves a valid game and can read it back', () => {
    const storage = createMemoryStorage()
    const state = makeGameState()

    expect(saveGame(state, storage)).toBe(true)
    expect(savedGameExists(storage)).toBe(true)

    const loaded = loadSavedGame(storage)
    expect(loaded?.player.geodes).toBe(1000)
    expect(loadResumableGame(TEST_COUNTRIES, storage)?.player).toEqual(
      state.player,
    )
  })

  it('treats missing data as no saved game', () => {
    const storage = createMemoryStorage()

    expect(loadSavedGame(storage)).toBeNull()
    expect(loadResumableGame(TEST_COUNTRIES, storage)).toBeNull()
    expect(savedGameExists(storage)).toBe(false)
  })

  it('treats malformed JSON as no saved game', () => {
    const storage = createMemoryStorage()
    storage.setItem(SAVED_GAME_KEY, '{oops')

    expect(loadSavedGame(storage)).toBeNull()
    expect(savedGameExists(storage)).toBe(false)
    expect(loadResumableGame(TEST_COUNTRIES, storage)).toBeNull()
  })

  it('treats raw non-object storage as no saved game', () => {
    const storage = createMemoryStorage()
    seedStored('just a string', storage)

    expect(loadSavedGame(storage)).toBeNull()
  })

  it('clears the stored game', () => {
    const storage = createMemoryStorage()
    saveGame(makeGameState(), storage)
    expect(savedGameExists(storage)).toBe(true)

    clearSavedGame(storage)

    expect(savedGameExists(storage)).toBe(false)
    expect(storage.size).toBe(0)
  })

  it('clears the stored game when the player is out of lives', () => {
    const storage = createMemoryStorage()
    const state = makeGameState()
    state.player.lives = 0

    expect(saveGame(state, storage)).toBe(false)
    expect(savedGameExists(storage)).toBe(false)
  })
})

describe('isSavedGameState validation', () => {
  function mutate(value: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  }

  it('rejects a future/incompatible version', () => {
    const state = mutate(makeSavedState())
    state.version = SAVED_GAME_VERSION + 1

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects negative geodes', () => {
    const state = mutate(makeSavedState())
    ;(state.player as Record<string, unknown>).geodes = -5

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects lives beyond the configured cap', () => {
    const state = mutate(makeSavedState())
    ;(state.player as Record<string, unknown>).lives = 100

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects an unknown clue id', () => {
    const state = mutate(makeSavedState())
    ;(state.revealedClueIds as string[]).push('not-a-clue')

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects a purchased clue that was never revealed', () => {
    const state = mutate(makeSavedState())
    ;(state.purchasedClueIds as string[]).push('capital')
    state.revealedClueIds = ['population']

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects a starting clue that is not revealed', () => {
    const state = mutate(makeSavedState())
    state.startingClueId = 'capital'
    state.revealedClueIds = ['population']

    expect(isSavedGameState(state)).toBe(false)
  })

  it('rejects a correct guess result naming a different country', () => {
    const state = mutate(makeSavedState())
    state.guessResult = {
      outcome: 'correct',
      guessedName: 'Japan',
      countryId: 'ja',
      livesRemaining: 3,
      geodesAwarded: 500,
    }

    expect(isSavedGameState(state)).toBe(false)
  })

  it('accepts an incorrect guess result', () => {
    const state = mutate(makeSavedState())
    state.guessResult = {
      outcome: 'incorrect',
      guessedName: 'Nope',
      livesRemaining: 2,
    }

    expect(isSavedGameState(state)).toBe(true)
  })
})
