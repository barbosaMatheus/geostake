import { describe, expect, it } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import type { GameState } from '../types/game'
import { GAME_CONFIG } from './config'
import { revealClue } from './clues'
import {
  applyGuess,
  createInitialGameState,
  isCorrectGuess,
  normalizeCountryName,
  startNextTurn,
} from './game'

const alwaysSelectFirst = () => 0
const alwaysSelectLast = () => 0.9999

describe('normalizeCountryName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCountryName('  Brazil  ')).toBe('brazil')
  })

  it('lowercases the name', () => {
    expect(normalizeCountryName('FRANCE')).toBe('france')
  })
})

describe('isCorrectGuess', () => {
  it('accepts a matching guess regardless of case or spacing', () => {
    const country = TEST_COUNTRIES[0]
    expect(isCorrectGuess(`  ${country.name.toUpperCase()}  `, country)).toBe(
      true,
    )
  })

  it('rejects a mismatched guess', () => {
    expect(isCorrectGuess('Atlantis', TEST_COUNTRIES[0])).toBe(false)
  })
})

describe('createInitialGameState', () => {
  it('creates a state with the configured starting resources', () => {
    const state = createInitialGameState(TEST_COUNTRIES)

    expect(state.player.geodes).toBe(GAME_CONFIG.startingGeodes)
    expect(state.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(state.turn).toBe(1)
    expect(state.guessResult).toBeNull()
  })

  it('selects a mystery country from the provided collection', () => {
    const state = createInitialGameState(TEST_COUNTRIES)

    expect(TEST_COUNTRIES).toContain(state.mysteryCountry)
  })

  it('respects the injected random source', () => {
    const first = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const last = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectLast,
    )

    expect(first.mysteryCountry).toBe(TEST_COUNTRIES[0])
    expect(last.mysteryCountry).toBe(TEST_COUNTRIES[TEST_COUNTRIES.length - 1])
  })

  it('throws when no countries are available', () => {
    expect(() => createInitialGameState([])).toThrow()
  })

  it('reveals exactly one tier zero starting clue on the first turn', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(state.revealedClueIds).toHaveLength(1)
    expect(state.revealedClueIds[0]).toBe(state.startingClueId)
  })
})

describe('applyGuess', () => {
  it('keeps lives unchanged and records a correct result', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, TEST_COUNTRIES[0].name)

    expect(next.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
    if (next.guessResult?.outcome === 'correct') {
      expect(next.guessResult.country).toBe(TEST_COUNTRIES[0])
      expect(next.guessResult.livesRemaining).toBe(GAME_CONFIG.startingLives)
    }
  })

  it('reduces lives by one on an incorrect guess', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.lives).toBe(GAME_CONFIG.startingLives - 1)
    expect(next.guessResult?.outcome).toBe('incorrect')
    if (next.guessResult?.outcome === 'incorrect') {
      expect(next.guessResult.livesRemaining).toBe(
        GAME_CONFIG.startingLives - 1,
      )
    }
  })

  it('matches a correct guess regardless of the player capitalization', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, TEST_COUNTRIES[0].name.toUpperCase())

    expect(next.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
  })

  it('does not reduce lives below zero', () => {
    const state: GameState = {
      ...createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      player: { geodes: GAME_CONFIG.startingGeodes, lives: 0 },
    }
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.lives).toBe(0)
  })

  it('ignores a second guess on the same turn', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const resolved = applyGuess(state, 'Atlantis')
    const again = applyGuess(resolved, TEST_COUNTRIES[0].name)

    expect(again).toBe(resolved)
  })
})

describe('startNextTurn', () => {
  it('advances the turn, clears the result, and selects a new country', () => {
    const resolved = applyGuess(
      createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      TEST_COUNTRIES[0].name,
    )
    const next = startNextTurn(resolved, TEST_COUNTRIES, alwaysSelectFirst)

    expect(next.turn).toBe(2)
    expect(next.guessResult).toBeNull()
    expect(next.mysteryCountry).toBe(TEST_COUNTRIES[0])
    expect(next.player.lives).toBe(resolved.player.lives)
  })

  it('does nothing when the current turn has not been resolved', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(startNextTurn(state, TEST_COUNTRIES)).toBe(state)
  })

  it('throws when no countries remain for the next turn', () => {
    const resolved = applyGuess(
      createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      'Atlantis',
    )

    expect(() => startNextTurn(resolved, [])).toThrow()
  })

  it('clears previously revealed clues when the next turn starts', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const withPurchasedClue = revealClue(state, 'region')
    const resolved = applyGuess(withPurchasedClue, 'Atlantis')
    const next = startNextTurn(resolved, TEST_COUNTRIES, alwaysSelectFirst)

    expect(next.revealedClueIds).toHaveLength(1)
    expect(next.revealedClueIds[0]).toBe(next.startingClueId)
    expect(next.revealedClueIds).not.toContain('region')
    expect(next.player.geodes).toBe(withPurchasedClue.player.geodes)
  })
})
