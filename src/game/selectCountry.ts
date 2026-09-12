import type { Country } from '../types/country'

export function selectMysteryCountry(
  countries: readonly Country[],
  random: () => number = Math.random,
): Country {
  if (countries.length === 0) {
    throw new Error('Cannot select a mystery country from an empty collection')
  }
  const index = Math.min(
    countries.length - 1,
    Math.max(0, Math.floor(random() * countries.length)),
  )
  return countries[index]
}
