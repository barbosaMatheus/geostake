import type { Country } from '../types/country'
import type { TutorialState } from '../types/tutorial'
import { selectStartingClue } from './clues'
import { GAME_CONFIG, type GameConfig } from './config'

/**
 * The country id GeoStake always uses as the tutorial's mystery country.
 */
export const TUTORIAL_COUNTRY_ID = 'br'

export function findTutorialCountry(
  countries: readonly Country[],
): Country {
  const country = countries.find((c) => c.id === TUTORIAL_COUNTRY_ID)
  if (country === undefined) {
    throw new Error('Cannot start the tutorial without Brazil in the dataset')
  }
  return country
}

/**
 * Creates a fresh tutorial: the fixed mystery country with the normal starting
 * resources (configured starting geodes and lives) and a randomly selected
 * tier-0 starting clue. Tutorial state is a self-contained `TutorialState`
 * that is never persisted and never shared with the regular game.
 */
export function createTutorialState(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random: () => number = Math.random,
): TutorialState {
  const mysteryCountry = findTutorialCountry(countries)
  const startingClueId = selectStartingClue(mysteryCountry, random)
  return {
    game: {
      player: {
        geodes: config.economy.startingGeodes,
        lives: config.economy.startingLives,
      },
      mysteryCountry,
      turn: 1,
      guessResult: null,
      startingClueId,
      revealedClueIds: [startingClueId],
      purchasedClueIds: [],
    },
  }
}