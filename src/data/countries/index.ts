import type { Country } from '../../types/country'
import canonicalCountries from './countries.json'

export const COUNTRIES: readonly Country[] =
  canonicalCountries as readonly Country[]
