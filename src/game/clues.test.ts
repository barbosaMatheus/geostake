import { describe, expect, it } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import { CLUES, getClueDefinition } from './clueConfig'
import { GAME_CONFIG } from './config'
import {
  canAffordClue,
  formatClueValue,
  getClueCost,
  getAvailableClues,
  getClueValue,
  getTurnClues,
  isClueAvailable,
  revealClue,
  selectStartingClues,
  STARTING_CLUE_COUNT,
} from './clues'
import { applyGuess, createInitialGameState, startNextTurn } from './game'
import type { GameState } from '../types/game'

const [brazil, japan] = TEST_COUNTRIES

const alwaysFirst = () => 0
const alwaysLast = () => 0.9999

const RETIRED_CLUE_ID = 'lowest-elevation'

/** Cycles through fixed values so every pick in a selection is predictable. */
function cyclingRandom(values: readonly number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]
}

/** A deterministic pseudo-random generator, used to stress the selection. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

/** Brazil, but with the retired lowest-elevation fact still present. */
const countryWithLowestElevation: Country = {
  ...brazil,
  id: 'mv',
  name: 'Maldives',
  lowestElevationM: -2,
}

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

describe('selectStartingClues', () => {
  it('returns exactly two free clues at a normal turn start', () => {
    for (const country of [brazil, japan]) {
      for (let seed = 1; seed <= 25; seed += 1) {
        expect(selectStartingClues(country, seededRandom(seed))).toHaveLength(
          STARTING_CLUE_COUNT,
        )
      }
    }
  })

  it('only selects clues from the free tier', () => {
    for (const country of [brazil, japan]) {
      for (let seed = 1; seed <= 25; seed += 1) {
        for (const id of selectStartingClues(country, seededRandom(seed))) {
          expect(CLUES.find((clue) => clue.id === id)?.tier).toBe(0)
        }
      }
    }
  })

  it('only selects clues that are available for the country', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      for (const id of selectStartingClues(brazil, seededRandom(seed))) {
        expect(isClueAvailable(id, brazil)).toBe(true)
      }
    }

    expect(selectStartingClues(brazil, alwaysFirst)).not.toContain('coastline')
  })

  it('never selects the same clue twice', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const selected = selectStartingClues(brazil, seededRandom(seed))

      expect(new Set(selected).size).toBe(selected.length)
    }
  })

  it('still selects two distinct clues when randomness keeps asking for the first', () => {
    const selected = selectStartingClues(brazil, cyclingRandom([0, 0, 0, 0]))

    expect(selected).toHaveLength(2)
    expect(new Set(selected).size).toBe(2)
  })

  it('takes the clues from across the pool as randomness varies', () => {
    expect(selectStartingClues(brazil, alwaysFirst)).toEqual([
      'population',
      'land-area',
    ])
    expect(selectStartingClues(japan, alwaysFirst)).toEqual([
      'population',
      'land-area',
    ])
    expect(selectStartingClues(japan, alwaysLast)).toEqual([
      'hemisphere',
      'coastline',
    ])
  })

  it('never selects the retired lowest-elevation clue, even when the data exists', () => {
    for (const random of [alwaysFirst, alwaysLast]) {
      expect(
        selectStartingClues(countryWithLowestElevation, random),
      ).not.toContain(RETIRED_CLUE_ID)
    }
  })

  it('reveals both free clues when the pool holds exactly two', () => {
    const twoClues = CLUES.filter(
      (clue) => clue.id === 'population' || clue.id === 'hemisphere',
    )

    expect(selectStartingClues(brazil, alwaysFirst, twoClues)).toEqual([
      'population',
      'hemisphere',
    ])
  })

  it('reveals a single free clue when the pool is smaller than two', () => {
    const hemisphereOnly = CLUES.filter((clue) => clue.id === 'hemisphere')
    const landAreaOnly = CLUES.filter((clue) => clue.id === 'land-area')

    expect(selectStartingClues(brazil, alwaysLast, hemisphereOnly)).toEqual([
      'hemisphere',
    ])
    expect(selectStartingClues(brazil, alwaysFirst, landAreaOnly)).toEqual([
      'land-area',
    ])
  })

  it('falls back to population when no tier zero clue is available', () => {
    const highestElevationOnly = CLUES.filter(
      (clue) => clue.id === 'highest-elevation',
    )

    expect(
      selectStartingClues(brazil, alwaysLast, highestElevationOnly),
    ).toEqual(['population'])
  })
})

describe('getAvailableClues', () => {
  it('excludes optional-data clues whose data is missing', () => {
    const availableIds = getAvailableClues(brazil).map((clue) => clue.id)

    expect(availableIds).not.toContain('coastline')
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
  })

  it('never offers the retired lowest-elevation clue, even when the data exists', () => {
    const availableIds = getAvailableClues(countryWithLowestElevation).map(
      (clue) => clue.id,
    )

    expect(availableIds).not.toContain(RETIRED_CLUE_ID)
    expect(availableIds).toContain('population')
    expect(availableIds).toContain('region')
  })

  it('offers the visual clues when the country has a resolvable ISO code', () => {
    const availableIds = getAvailableClues(japan).map((clue) => clue.id)

    expect(availableIds).toContain('country-outline')
    expect(availableIds).toContain('country-flag')
  })

  it('hides the visual clues when the country has no resolvable ISO code', () => {
    const availableIds = getAvailableClues(brazil).map((clue) => clue.id)

    expect(availableIds).not.toContain('country-outline')
    expect(availableIds).not.toContain('country-flag')
  })
})

describe('isClueAvailable', () => {
  it('reports optional data clues unavailable when the data is missing', () => {
    expect(isClueAvailable('coastline', brazil)).toBe(false)
    expect(isClueAvailable('internet-country-code', brazil)).toBe(false)
    expect(isClueAvailable('highest-elevation', brazil)).toBe(false)
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

  it('reports visual clues available only when their asset resolves', () => {
    expect(isClueAvailable('country-outline', japan)).toBe(true)
    expect(isClueAvailable('country-flag', japan)).toBe(true)
    expect(isClueAvailable('country-outline', brazil)).toBe(false)
    expect(isClueAvailable('country-flag', brazil)).toBe(false)
  })
})

describe('getTurnClues', () => {
  it('includes the free starting clues and every non-free clue', () => {
    const ids = getTurnClues(['population', 'hemisphere'], CLUES).map(
      (clue) => clue.id,
    )

    expect(ids).toContain('population')
    expect(ids).toContain('hemisphere')
    expect(ids).toContain('region')
    expect(ids).toContain('highest-elevation')
    expect(ids).toContain('national-colors')
    expect(ids).toContain('capital')
    expect(ids).toContain('internet-country-code')
  })

  it('omits free-tier clues that did not start the turn', () => {
    const ids = getTurnClues(['population', 'hemisphere'], CLUES).map(
      (clue) => clue.id,
    )

    expect(ids).not.toContain('land-area')
    expect(ids).not.toContain('population-density')
    expect(ids).not.toContain('coastline')
  })

  it('offers only one free-tier clue when a single free clue was revealed', () => {
    const ids = getTurnClues(['population'], CLUES).map((clue) => clue.id)

    expect(ids).toContain('population')
    expect(ids).not.toContain('land-area')
    expect(ids).not.toContain('hemisphere')
  })
})

describe('the retired lowest-elevation clue', () => {
  it('has no configured definition, so it cannot be resolved at all', () => {
    expect(() => getClueDefinition(RETIRED_CLUE_ID as ClueId)).toThrow(
      /no clue definition exists/i,
    )
  })

  it('is neither revealed nor purchasable through revealClue', () => {
    const state = createInitialGameState(
      [countryWithLowestElevation],
      GAME_CONFIG,
      alwaysFirst,
    )

    const next = revealClue(state, RETIRED_CLUE_ID as ClueId)

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain(RETIRED_CLUE_ID)
    expect(next.purchasedClueIds).not.toContain(RETIRED_CLUE_ID)
    expect(next.player.geodes).toBe(state.player.geodes)
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
    expect(next.purchasedClueIds).toContain('region')
  })

  it('deducts the multiplied cost for higher-tier clues', () => {
    const japanState = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(japanState, 'internet-country-code')

    expect(next.player.geodes).toBe(japanState.player.geodes - 375)
    expect(next.revealedClueIds).toContain('internet-country-code')
    expect(next.purchasedClueIds).toContain('internet-country-code')
  })

  it('does not allow the same clue to be purchased twice', () => {
    const state = revealClue(firstState(), 'region')
    const again = revealClue(state, 'region')

    expect(again).toBe(state)
    expect(again.player.geodes).toBe(state.player.geodes)
    expect(again.purchasedClueIds).toEqual(state.purchasedClueIds)
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
    expect(next.purchasedClueIds).not.toContain('region')
  })

  it('does not change game state for an unavailable clue', () => {
    const state = firstState()
    const next = revealClue(state, 'internet-country-code')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('internet-country-code')
    expect(next.player.geodes).toBe(state.player.geodes)
  })

  it('does not reveal a free-tier clue that did not start the turn', () => {
    const state = firstState()
    const next = revealClue(state, 'population-density')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('population-density')
  })

  it('does not purchase the free-tier hemisphere clue when it does not start the turn', () => {
    const state = firstState()
    const next = revealClue(state, 'hemisphere')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('hemisphere')
    expect(next.purchasedClueIds).toEqual([])
    expect(next.player.geodes).toBe(state.player.geodes)
  })

  it('does not purchase the free-tier coastline clue when it does not start the turn', () => {
    const japanState = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(japanState, 'coastline')

    expect(next).toBe(japanState)
    expect(next.revealedClueIds).not.toContain('coastline')
    expect(next.purchasedClueIds).toEqual([])
    expect(next.player.geodes).toBe(japanState.player.geodes)
  })

  it('keeps the free starting clues revealed alongside purchased clues', () => {
    const state = firstState()
    const next = revealClue(state, 'region')

    for (const id of state.startingClueIds) {
      expect(next.revealedClueIds).toContain(id)
      expect(next.purchasedClueIds).not.toContain(id)
    }
    expect(next.purchasedClueIds).toEqual(['region'])
  })

  it('does not reveal clues after the turn has been resolved', () => {
    const state = applyGuess(firstState(), TEST_COUNTRIES[0].name)
    const next = revealClue(state, 'region')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('region')
    expect(next.purchasedClueIds).not.toContain('region')
  })
})

describe('clue state across turns', () => {
  it('starts a game with exactly two distinct free starting clues', () => {
    const state = firstState()

    expect(state.startingClueIds).toHaveLength(STARTING_CLUE_COUNT)
    expect(new Set(state.startingClueIds).size).toBe(STARTING_CLUE_COUNT)
    expect(state.revealedClueIds).toEqual([...state.startingClueIds])
    expect(state.purchasedClueIds).toEqual([])
    for (const id of state.startingClueIds) {
      expect(CLUES.find((clue) => clue.id === id)?.tier).toBe(0)
    }
  })

  it('reveals the free starting clues without charging geodes', () => {
    const state = firstState()

    for (const id of state.startingClueIds) {
      expect(getClueCost(id)).toBe(0)
    }
    expect(state.player.geodes).toBe(GAME_CONFIG.economy.startingGeodes)
  })

  it('does not count the free starting clues as purchased clues', () => {
    const state = firstState()

    expect(state.purchasedClueIds).toEqual([])
    expect(state.purchasedClueIds).not.toContain(state.startingClueIds[0])
    expect(state.purchasedClueIds).not.toContain(state.startingClueIds[1])
  })

  it('clears previously revealed and purchased clues when a new turn starts', () => {
    const state = revealClue(firstState(), 'region')
    expect(state.revealedClueIds).toContain('region')
    expect(state.purchasedClueIds).toEqual(['region'])

    const newTurn = nextTurnState(state)

    expect(newTurn.revealedClueIds).toHaveLength(STARTING_CLUE_COUNT)
    expect(newTurn.revealedClueIds).toEqual([...newTurn.startingClueIds])
    expect(newTurn.revealedClueIds).not.toContain('region')
    expect(newTurn.purchasedClueIds).toEqual([])
  })

  it('selects a new pair of free clues for the new turn', () => {
    const state = revealClue(firstState(), 'region')
    const newTurn = nextTurnState(state, alwaysLast)

    expect(newTurn.startingClueIds).toHaveLength(STARTING_CLUE_COUNT)
    expect(new Set(newTurn.startingClueIds).size).toBe(STARTING_CLUE_COUNT)
    expect(newTurn.startingClueIds).toContain('hemisphere')
    expect(newTurn.startingClueIds).not.toEqual(state.startingClueIds)
    expect(newTurn.revealedClueIds).toEqual([...newTurn.startingClueIds])
  })
})

describe('moved clues keep their reveal behavior', () => {
  it('charges the existing cost for the low-tier highest elevation clue', () => {
    const japanState = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(japanState, 'highest-elevation')

    expect(next.player.geodes).toBe(japanState.player.geodes - 100)
    expect(next.purchasedClueIds).toEqual(['highest-elevation'])
  })

  it('charges the existing cost for the medium-tier national colors clue', () => {
    const next = revealClue(firstState(), 'national-colors')

    expect(next.player.geodes).toBe(firstState().player.geodes - 250)
    expect(next.purchasedClueIds).toEqual(['national-colors'])
  })
})

describe('visual clues', () => {
  it('reveals the country outline at its tier 3 cost', () => {
    const state = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(state, 'country-outline')

    expect(next.player.geodes).toBe(state.player.geodes - 250)
    expect(next.revealedClueIds).toContain('country-outline')
    expect(next.purchasedClueIds).toContain('country-outline')
  })

  it('reveals the country flag at its tier 4 cost', () => {
    const state = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(state, 'country-flag')

    expect(next.player.geodes).toBe(state.player.geodes - 375)
    expect(next.revealedClueIds).toContain('country-flag')
    expect(next.purchasedClueIds).toContain('country-flag')
  })

  it('tracks purchased visual clues separately from the free tier 0 clues', () => {
    const state = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const next = revealClue(state, 'country-flag')

    expect(next.purchasedClueIds).toEqual(['country-flag'])
    expect(next.revealedClueIds).toContain('country-flag')
    for (const id of state.startingClueIds) {
      expect(next.purchasedClueIds).not.toContain(id)
      expect(next.revealedClueIds).toContain(id)
    }
  })

  it('does not reveal a visual clue twice', () => {
    const state = createInitialGameState([japan], GAME_CONFIG, alwaysFirst)
    const revealed = revealClue(state, 'country-outline')
    const again = revealClue(revealed, 'country-outline')

    expect(again).toBe(revealed)
    expect(again.purchasedClueIds).toEqual(['country-outline'])
  })

  it('does not reveal a visual clue that cannot be afforded', () => {
    const state = {
      ...createInitialGameState([japan], GAME_CONFIG, alwaysFirst),
      player: {
        ...createInitialGameState([japan], GAME_CONFIG, alwaysFirst).player,
        geodes: 300,
      },
    }
    const next = revealClue(state, 'country-flag')

    expect(next).toBe(state)
    expect(next.revealedClueIds).not.toContain('country-flag')
  })

  it('does not reveal a visual clue whose asset cannot be resolved', () => {
    const state = createInitialGameState([brazil], GAME_CONFIG, alwaysFirst)
    const next = revealClue(state, 'country-outline')
    const flagNext = revealClue(state, 'country-flag')

    expect(next).toBe(state)
    expect(flagNext).toBe(state)
    expect(next.revealedClueIds).not.toContain('country-outline')
    expect(flagNext.purchasedClueIds).not.toContain('country-flag')
  })
})
