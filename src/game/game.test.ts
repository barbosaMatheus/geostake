import { describe, expect, it } from 'vitest'
import { MOCK_COUNTRIES } from '../data/mockCountries'
import type { GameState } from '../types/game'
import { GAME_CONFIG } from './config'
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
    const country = MOCK_COUNTRIES[0]
    expect(isCorrectGuess(`  ${country.name.toUpperCase()}  `, country)).toBe(
      true,
    )
  })

  it('rejects a mismatched guess', () => {
    expect(isCorrectGuess('Atlantis', MOCK_COUNTRIES[0])).toBe(false)
  })
})

describe('createInitialGameState', () => {
  it('creates a state with the configured starting resources', () => {
    const state = createInitialGameState(MOCK_COUNTRIES)

    expect(state.player.geodes).toBe(GAME_CONFIG.startingGeodes)
    expect(state.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(state.turn).toBe(1)
    expect(state.guessResult).toBeNull()
  })

  it('selects a mystery country from the provided collection', () => {
    const state = createInitialGameState(MOCK_COUNTRIES)

    expect(MOCK_COUNTRIES).toContain(state.mysteryCountry)
  })

  it('respects the injected random source', () => {
    const first = createInitialGameState(
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const last = createInitialGameState(
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectLast,
    )

    expect(first.mysteryCountry).toBe(MOCK_COUNTRIES[0])
    expect(last.mysteryCountry).toBe(MOCK_COUNTRIES[MOCK_COUNTRIES.length - 1])
  })

  it('throws when no countries are available', () => {
    expect(() => createInitialGameState([])).toThrow()
  })
})

describe('applyGuess', () => {
  it('keeps lives unchanged and records a correct result', () => {
    const state = createInitialGameState(
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, MOCK_COUNTRIES[0].name)

    expect(next.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
    if (next.guessResult?.outcome === 'correct') {
      expect(next.guessResult.country).toBe(MOCK_COUNTRIES[0])
      expect(next.guessResult.livesRemaining).toBe(GAME_CONFIG.startingLives)
    }
  })

  it('reduces lives by one on an incorrect guess', () => {
    const state = createInitialGameState(
      MOCK_COUNTRIES,
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
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, MOCK_COUNTRIES[0].name.toUpperCase())

    expect(next.player.lives).toBe(GAME_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
  })

  it('does not reduce lives below zero', () => {
    const state: GameState = {
      ...createInitialGameState(MOCK_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      player: { geodes: GAME_CONFIG.startingGeodes, lives: 0 },
    }
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.lives).toBe(0)
  })

  it('ignores a second guess on the same turn', () => {
    const state = createInitialGameState(
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const resolved = applyGuess(state, 'Atlantis')
    const again = applyGuess(resolved, MOCK_COUNTRIES[0].name)

    expect(again).toBe(resolved)
  })
})

describe('startNextTurn', () => {
  it('advances the turn, clears the result, and selects a new country', () => {
    const resolved = applyGuess(
      createInitialGameState(MOCK_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      MOCK_COUNTRIES[0].name,
    )
    const next = startNextTurn(resolved, MOCK_COUNTRIES, alwaysSelectFirst)

    expect(next.turn).toBe(2)
    expect(next.guessResult).toBeNull()
    expect(next.mysteryCountry).toBe(MOCK_COUNTRIES[0])
    expect(next.player.lives).toBe(resolved.player.lives)
  })

  it('does nothing when the current turn has not been resolved', () => {
    const state = createInitialGameState(
      MOCK_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(startNextTurn(state, MOCK_COUNTRIES)).toBe(state)
  })

  it('throws when no countries remain for the next turn', () => {
    const resolved = applyGuess(
      createInitialGameState(MOCK_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      'Atlantis',
    )

    expect(() => startNextTurn(resolved, [])).toThrow()
  })
})
