import type { Country } from '../src/types/country.ts'

/**
 * The canonical GeoStake dataset keys countries by FactsBook GEC (formerly
 * FIPS) codes, not ISO 3166-1 alpha-2 codes. This module derives each
 * country's ISO alpha-2 code for use by dev-time asset coverage checks.
 *
 * The derived code comes from the country's FactsBook `internetCountryCode`
 * field: the country code top-level domain, which corresponds to the ISO code.
 */
export const GEC_TO_ISO_OVERRIDES: Record<string, string> = {
  // United Kingdom: the UK cctld is ".uk", but its ISO alpha-2 code is "GB".
  uk: 'GB',
  // France's FactsBook internet field lists multiple dependent territory
  // codes; the country itself is "FR".
  fr: 'FR',
}

export function isoCodeOf(
  country: Pick<Country, 'id' | 'name' | 'internetCountryCode'>,
): string {
  const override = GEC_TO_ISO_OVERRIDES[country.id]
  if (override !== undefined) {
    return override
  }
  const match = (country.internetCountryCode ?? '')
    .toLowerCase()
    .match(/\.([a-z]{2})/)
  if (match === null) {
    throw new Error(
      `Cannot derive ISO 3166-1 alpha-2 code for "${country.id}" (${country.name}): no 2-letter internet country code`,
    )
  }
  return match[1].toUpperCase()
}
