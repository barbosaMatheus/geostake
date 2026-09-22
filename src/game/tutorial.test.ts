import { describe, expect, it } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import { getClueDefinition } from './clueConfig'
import { GAME_CONFIG } from './config'
import { ECONOMY_CONFIG } from './economyConfig'
import {
  createTutorialState,
  findTutorialCountry,
  TUTORIAL_COUNTRY_ID,
} from './tutorial'

const alwaysSelectFirst = () => 0

describe('findTutorialCountry', () => {
  it('returns the fixed tutorial country (Brazil)', () => {
    const country = findTutorialCountry(TEST_COUNTRIES)

    expect(country.id).toBe(TUTORIAL_COUNTRY_ID)
    expect(country.name).toBe('Brazil')
  })

  it('throws when the tutorial country is missing from the dataset', () => {
    const withoutBrazil = TEST_COUNTRIES.filter(
      (country) => country.id !== TUTORIAL_COUNTRY_ID,
    )

    expect(() => findTutorialCountry(withoutBrazil)).toThrow()
  })
})

describe('createTutorialState', () => {
  it('always uses Brazil as the mystery country', () => {
    const once = createTutorialState(TEST_COUNTRIES)
    const again = createTutorialState(TEST_COUNTRIES)

    expect(once.game.mysteryCountry.id).toBe('br')
    expect(again.game.mysteryCountry.id).toBe('br')
    expect(once.game.mysteryCountry.name).toBe('Brazil')
  })

  it('starts with the configured starting geodes and lives', () => {
    const state = createTutorialState(TEST_COUNTRIES)

    expect(state.game.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
    expect(state.game.player.lives).toBe(ECONOMY_CONFIG.startingLives)
  })

  it('starts on turn 1 with no result and exactly one revealed starting clue', () => {
    const state = createTutorialState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst)

    expect(state.game.turn).toBe(1)
    expect(state.game.guessResult).toBeNull()
    expect(state.game.revealedClueIds).toHaveLength(1)
    expect(state.game.revealedClueIds[0]).toBe(state.game.startingClueId)
    expect(state.game.purchasedClueIds).toEqual([])
  })

  it('reveals a tier-0 starting clue', () => {
    const state = createTutorialState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst)

    expect(getClueDefinition(state.game.startingClueId).tier).toBe(0)
  })

  it('each created state is independent from the previous one', () => {
    const state = createTutorialState(TEST_COUNTRIES)

    expect(state).not.toBe(createTutorialState(TEST_COUNTRIES))

    state.game.player.geodes = 5
    const fresh = createTutorialState(TEST_COUNTRIES)
    expect(fresh.game.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
  })

  it('throws when Brazil is not in the dataset', () => {
    const withoutBrazil = TEST_COUNTRIES.filter(
      (country) => country.id !== TUTORIAL_COUNTRY_ID,
    )

    expect(() => createTutorialState(withoutBrazil)).toThrow()
  })

  it('respects the injected random source for the starting clue', () => {
    const state = createTutorialState(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst)

    expect(['population', 'land-area', 'population-density', 'lowest-elevation']).toContain(
      state.game.startingClueId,
    )
  })
})