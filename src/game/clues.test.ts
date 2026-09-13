import { describe, expect, it } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import { CLUES } from './clueConfig'
import { GAME_CONFIG } from './config'
import {
  canAffordClue,
  formatClueValue,
  getAvailableClues,
  getClueValue,
  getTurnClues,
  isClueAvailable,
  revealClue,
  selectStartingClue,
} from './clues'
import { applyGuess, createInitialGameState, startNextTurn } from './game'
import type { GameState } from '../types/game'

const [brazil, japan] = TEST_COUNTRIES

const alwaysFirst = () => 0
const alwaysLast = () => 0.9999

function firstState(): GameState {
  return createInitialGameState(TEST_COUNTRIES, GAME_CONFIG, alwaysFirst)
}

function nextTurnState(
  state: GameState,
  random: () => number = alwaysFirst,
): GameState {
  const resolved = applyGuess(state, TEST_COUNTRIES[0].name)
  return startNextTurn(resolved, TEST_COUNTRIES, random)
}

describe('selectStartingClue', () => {
  it('returns exactly one tier zero clue', () => {
    const clue = selectStartingClue(brazil, alwaysFirst)

    expect(typeof clue).toBe('string')
    const definition = CLUES.find((candidate) => candidate.id === clue)
    expect(definition?.tier).toBe(0)
  })

  it('does not pick the unavailable lowest-elevation clue for a country without one', () => {
    for (const random of [alwaysFirst, alwaysLast]) {
      expect(selectStartingClue(japan, random)).not.toBe('lowest-elevation')
    }
  })

  it('randomizes across the available clues when several are available', () => {
    const withFirst = selectStartingClue(japan, alwaysFirst)
    const withLast = selectStartingClue(japan, alwaysLast)

    expect(withFirst).toBe('population')
    expect(withLast).toBe('population-density')
    expect(withFirst).not.toBe(withLast)
  })

  it('returns the sole tier zero clue when the clue list is narrowed', () => {
    const landAreaOnly = CLUES.filter((clue) => clue.id === 'land-area')

    expect(selectStartingClue(brazil, alwaysFirst, landAreaOnly)).toBe(
      'land-area',
    )
  })

  it('falls back to population when no tier zero clue is available', () => {
    const coastlineOnly = CLUES.filter((clue) => clue.id === 'coastline')

    expect(selectStartingClue(brazil, alwaysLast, coastlineOnly)).toBe(
      'population',
    )
  })
})

describe('getAvailableClues', () => {
  it('excludes optional-data clues whose data is missing', () => {
    const availableIds = getAvailableClues(brazil).map((clue) => clue.id)

    expect(availableIds).not.toContain('coastline')
    expect(availableIds).not.toContain('lowest-elevation')
    expect(availableIds).not.toContain('highest-elevation')
    expect(availableIds).not.toContain('internet-country-code')
    expect(availableIds).toContain('population')
    expect(availableIds).toContain('region')
    expect(availableIds).toContain('national-colors')
  })

  it('includes optional-data clues whose data is present', () => {
    const availableIds = getAvailableClues(japan).map((clue) => clue.id)

    expect(availableIds).toContain('coastline')
    expect(availableIds).toContain('highest-elevation')
    expect(availableIds).toContain('internet-country-code')
    expect(availableIds).not.toContain('lowest-elevation')
  })
})

describe('isClueAvailable', () => {
  it('reports optional data clues unavailable when the data is missing', () => {
    expect(isClueAvailable('coastline', brazil)).toBe(false)
    expect(isClueAvailable('lowest-elevation', brazil)).toBe(false)
    expect(isClueAvailable('internet-country-code', brazil)).toBe(false)
    expect(isClueAvailable('lowest-elevation', japan)).toBe(false)
  })

  it('reports optional data clues available when the data is present', () => {
    expect(isClueAvailable('coastline', japan)).toBe(true)
    expect(isClueAvailable('highest-elevation', japan)).toBe(true)
    expect(isClueAvailable('national-colors', brazil)).toBe(true)
  })

  it('reports required-data clues available for a valid country', () => {
    for (const id of [
      'population',
      'land-area',
      'population-density',
      'region',
      'hemisphere',
      'capital',
    ] as const) {
      expect(isClueAvailable(id, brazil)).toBe(true)
    }
  })
})

describe('getTurnClues', () => {
  it('includes the starting clue and every non-free clue', () => {
    const ids = getTurnClues('population', CLUES).map((clue) => clue.id)

    expect(ids).toContain('population')
    expect(ids).toContain('region')
    expect(ids).toContain('coastline')
    expect(ids).toContain('internet-country-code')
  })

  it('omits free-tier clues other than the starting clue', () => {
    const ids = getTurnClues('population', CLUES).map((clue) => clue.id)

    expect(ids).not.toContain('land-area')
    expect(ids).not.toContain('population-density')
    expect(ids).not.toContain('lowest-elevation')
  })
})

describe('getClueValue', () => {
  it('extracts each clue value from the correct country field', () => {
    expect(getClueValue('population', brazil)).toBe(brazil.population)
    expect(getClueValue('land-area', brazil)).toBe(brazil.landAreaKm2)
    expect(getClueValue('population-density', brazil)).toBe(
      brazil.populationDensity,
    )
    expect(getClueValue('region', brazil)).toBe(brazil.region)
    expect(getClueValue('hemisphere', brazil)).toBe(brazil.hemisphere)
    expect(getClueValue('capital', brazil)).toBe(brazil.capital)
    expect(getClueValue('national-colors', brazil)).toEqual(
      brazil.nationalColors,
    )
    expect(getClueValue('highest-elevation', japan)).toBe(
      japan.highestElevationM,
    )
    expect(getClueValue('internet-country-code', japan)).toBe(
      japan.internetCountryCode,
    )
    expect(getClueValue('coastline', japan)).toBe(japan.coastlineKm)
  })

  it('formats clue values for display', () => {
    expect(formatClueValue('population', brazil)).toBe('221,359,387')
    expect(formatClueValue('land-area', brazil)).toBe('8,358,140 km²')
    expect(formatClueValue('region', brazil)).toBe('South America')
    expect(formatClueValue('national-colors', brazil)).toBe(
      'green, yellow, blue',
    )
    expect(formatClueValue('internet-country-code', japan)).toBe('.jp')
  })
})

describe('canAffordClue', () => {
  it('accepts geodes equal to or above the current cost', () => {
    expect(canAffordClue('region', 50)).toBe(true)
    expect(canAffordClue('region', 51)).toBe(true)
    expect(canAffordClue('internet-country-code', 375)).toBe(true)
  })

  it('rejects geodes below the current cost', () => {
    expect(canAffordClue('region', 49)).toBe(false)
    expect(canAffordClue('capital', 50)).toBe(false)
  })
})

describe('revealClue', () => {
  it('deducts the correct number of geodes', () => {
    const state = firstState()
    const next = revealClue(state, 'region')

    expect(next.player.geodes).toBe(state.player.geodes - 50)
    expect(next.revealedClueIds).toContain('region')
  })

  it('deducts the multiplied cost for higher-tier clues', () => {
    const japanState = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(japanState, 'internet-country-code')

    expect(next.player.geodes).toBe(japanState.player.geodes - 375)
    expect(next.revealedClueIds).toContain('internet-country-code')
  })

  it('does not allow the same clue to be purchased twice', () => {
    const state = revealClue(firstState(), 'region')
    const again = revealClue(state, 'region')

    expect(again).toBe(state)
    expect(again.player.geodes).toBe(state.player.geodes)
  })

  it('does not reveal a clue the player cannot afford', () => {
    const state = {
      ...firstState(),
      player: { ...firstState().player, geodes: 40 },
    }
    const next = revealClue(state, 'region')

    expect(next).toBe(state)
    expect(next.player.geodes).toBe(40)
    expect(next.revealedClueIds).not.toContain('region')
  })

  it('does not change game state for an unavailable clue', () => {
    const state = firstState()
    const next = revealClue(state, 'lowest-elevation')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('lowest-elevation')
    expect(next.player.geodes).toBe(state.player.geodes)
  })

  it('does not reveal a free-tier clue that is not the starting clue', () => {
    const state = firstState()
    const next = revealClue(state, 'land-area')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('land-area')
  })

  it('keeps the starting clue revealed alongside purchased clues', () => {
    const state = firstState()
    const next = revealClue(state, 'region')

    expect(next.revealedClueIds).toContain(state.startingClueId)
  })

  it('does not reveal clues after the turn has been resolved', () => {
    const state = applyGuess(firstState(), TEST_COUNTRIES[0].name)
    const next = revealClue(state, 'region')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('region')
  })
})

describe('clue state across turns', () => {
  it('starts a game with exactly one revealed starting clue', () => {
    const state = firstState()

    expect(state.revealedClueIds).toHaveLength(1)
    expect(state.revealedClueIds[0]).toBe(state.startingClueId)
    const startingDefinition = CLUES.find(
      (clue) => clue.id === state.startingClueId,
    )
    expect(startingDefinition?.tier).toBe(0)
  })

  it('clears previously revealed clues when a new turn starts', () => {
    const state = revealClue(firstState(), 'region')
    expect(state.revealedClueIds).toContain('region')

    const newTurn = nextTurnState(state)

    expect(newTurn.revealedClueIds).toHaveLength(1)
    expect(newTurn.revealedClueIds[0]).toBe(newTurn.startingClueId)
    expect(newTurn.revealedClueIds).not.toContain('region')
  })

  it('selects a new starting clue for the new turn when randomness asks for it', () => {
    const state = revealClue(firstState(), 'region')
    const newTurn = nextTurnState(state, alwaysLast)

    expect(newTurn.startingClueId).toBe('population-density')
    expect(newTurn.revealedClueIds).toEqual(['population-density'])
  })
})
