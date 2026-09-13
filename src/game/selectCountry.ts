import type { Country } from '../types/country'
import { randomIndex } from './random'

export function selectMysteryCountry(
  countries: readonly Country[],
  random: () => number = Math.random,
): Country {
  if (countries.length === 0) {
    throw new Error('Cannot select a mystery country from an empty collection')
  }
  return countries[randomIndex(countries.length, random)]
}
