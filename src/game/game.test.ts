import { describe, expect, it } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import type { GameState } from '../types/game'
import { GAME_CONFIG } from './config'
import { ECONOMY_CONFIG } from './economyConfig'
import { revealClue } from './clues'
import {
  applyGuess,
  createInitialGameState,
  isCorrectGuess,
  normalizeCountryName,
  resolveGuess,
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

    expect(state.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
    expect(state.player.lives).toBe(ECONOMY_CONFIG.startingLives)
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
  it('keeps lives unchanged and records a correct result with a reward', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, TEST_COUNTRIES[0].name)

    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
    if (next.guessResult?.outcome === 'correct') {
      expect(next.guessResult.country).toBe(TEST_COUNTRIES[0])
      expect(next.guessResult.livesRemaining).toBe(ECONOMY_CONFIG.startingLives)
      expect(next.guessResult.geodesAwarded).toBe(ECONOMY_CONFIG.baseReward)
    }
    expect(next.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes + ECONOMY_CONFIG.baseReward,
    )
  })

  it('reduces the reward for clues purchased during the turn', () => {
    const withClue = revealClue(
      createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      'region',
    )
    const next = applyGuess(withClue, TEST_COUNTRIES[0].name)

    expect(next.guessResult?.outcome).toBe('correct')
    if (next.guessResult?.outcome === 'correct') {
      expect(next.guessResult.geodesAwarded).toBe(
        ECONOMY_CONFIG.baseReward - ECONOMY_CONFIG.baseClueDeduction,
      )
    }
    expect(next.player.geodes).toBe(
      withClue.player.geodes +
        (ECONOMY_CONFIG.baseReward - ECONOMY_CONFIG.baseClueDeduction),
    )
  })

  it('reduces lives by one and leaves the turn open on an incorrect guess', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives - 1)
    expect(next.guessResult).toBeNull()
    expect(next.mysteryCountry).toBe(state.mysteryCountry)
  })

  it('does not change geodes on an incorrect guess', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
  })

  it('matches a correct guess regardless of the player capitalization', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = applyGuess(state, TEST_COUNTRIES[0].name.toUpperCase())

    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives)
    expect(next.guessResult?.outcome).toBe('correct')
  })

  it('does not reduce lives below zero and closes the turn when they run out', () => {
    const state: GameState = {
      ...createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      player: { geodes: ECONOMY_CONFIG.startingGeodes, lives: 0 },
    }
    const next = applyGuess(state, 'Atlantis')

    expect(next.player.lives).toBe(0)
    expect(next.guessResult?.outcome).toBe('incorrect')
  })

  it('ignores a guess after the turn has been resolved by a correct answer', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const resolved = applyGuess(state, TEST_COUNTRIES[0].name)
    const again = applyGuess(resolved, TEST_COUNTRIES[0].name)

    expect(again).toBe(resolved)
  })

  it('allows a further guess after an incorrect guess', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const wrong = applyGuess(state, 'Atlantis')
    const right = applyGuess(wrong, TEST_COUNTRIES[0].name)

    expect(wrong.guessResult).toBeNull()
    expect(right.guessResult?.outcome).toBe('correct')
    expect(right.player.lives).toBe(ECONOMY_CONFIG.startingLives - 1)
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
      TEST_COUNTRIES[0].name,
    )

    expect(() => startNextTurn(resolved, [])).toThrow()
  })

  it('clears previously revealed and purchased clues when the next turn starts', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const withPurchasedClue = revealClue(state, 'region')
    const resolved = applyGuess(withPurchasedClue, TEST_COUNTRIES[0].name)
    const next = startNextTurn(resolved, TEST_COUNTRIES, alwaysSelectFirst)

    expect(next.revealedClueIds).toHaveLength(1)
    expect(next.revealedClueIds[0]).toBe(next.startingClueId)
    expect(next.revealedClueIds).not.toContain('region')
    expect(next.purchasedClueIds).toEqual([])
    expect(next.player.geodes).toBe(resolved.player.geodes)
  })

  it('resets to a fresh game when the player runs out of lives', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const withClue = revealClue(state, 'region')
    const firstLoss = applyGuess(withClue, 'Atlantis')
    const secondLoss = applyGuess(firstLoss, 'Atlantis')
    const lost = applyGuess(secondLoss, 'Atlantis')

    expect(lost.player.lives).toBe(0)
    expect(lost.guessResult?.outcome).toBe('incorrect')
    expect(lost.player.geodes).toBe(withClue.player.geodes)

    const next = startNextTurn(lost, TEST_COUNTRIES, alwaysSelectFirst)

    expect(next.turn).toBe(1)
    expect(next.guessResult).toBeNull()
    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives)
    expect(next.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
    expect(next.purchasedClueIds).toEqual([])
  })
})

describe('resolveGuess', () => {
  it('automatically advances to the next turn on a correct guess by default', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = resolveGuess(
      state,
      TEST_COUNTRIES[0].name,
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(next.guessResult).toBeNull()
    expect(next.turn).toBe(2)
    expect(next.revealedClueIds).toHaveLength(1)
    expect(next.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes + ECONOMY_CONFIG.baseReward,
    )
    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives)
    expect(next.mysteryCountry).toBe(TEST_COUNTRIES[0])
  })

  it('carries the rewarded geodes into the auto-advanced turn', () => {
    const withClue = revealClue(
      createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      'region',
    )
    const next = resolveGuess(
      withClue,
      TEST_COUNTRIES[0].name,
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(next.turn).toBe(2)
    expect(next.guessResult).toBeNull()
    expect(next.purchasedClueIds).toEqual([])
    expect(next.player.geodes).toBe(
      withClue.player.geodes +
        (ECONOMY_CONFIG.baseReward - ECONOMY_CONFIG.baseClueDeduction),
    )
  })

  it('does not auto-advance when continueOnCorrectGuess is disabled', () => {
    const config = { ...GAME_CONFIG, continueOnCorrectGuess: false }
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = resolveGuess(
      state,
      TEST_COUNTRIES[0].name,
      TEST_COUNTRIES,
      config,
      alwaysSelectFirst,
    )

    expect(next.guessResult?.outcome).toBe('correct')
    expect(next.turn).toBe(1)
    expect(next.startingClueId).toBe(state.startingClueId)
  })

  it('keeps the turn open on an incorrect guess', () => {
    const state = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )
    const next = resolveGuess(state, 'Atlantis', TEST_COUNTRIES)

    expect(next.guessResult).toBeNull()
    expect(next.turn).toBe(1)
    expect(next.mysteryCountry).toBe(state.mysteryCountry)
    expect(next.player.lives).toBe(ECONOMY_CONFIG.startingLives - 1)
  })

  it('is a no-op once the turn has already been resolved', () => {
    const manualConfig = { ...GAME_CONFIG, continueOnCorrectGuess: false }
    const state = resolveGuess(
      createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
      TEST_COUNTRIES[0].name,
      TEST_COUNTRIES,
      manualConfig,
      alwaysSelectFirst,
    )

    expect(state.guessResult?.outcome).toBe('correct')

    const again = resolveGuess(
      state,
      'Atlantis',
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(again).toBe(state)
  })
})
