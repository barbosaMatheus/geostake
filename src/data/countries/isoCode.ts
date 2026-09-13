import type { Country } from '../../types/country'

const GEC_TO_ISO_OVERRIDES: Record<string, string> = {
  // The United Kingdom country code top-level domain is ".uk", but its
  // ISO 3166-1 alpha-2 code is "GB".
  uk: 'GB',
  // France's FactsBook internet field lists multiple dependent-territory
  // codes; the country itself is "FR".
  fr: 'FR',
}

/**
 * Derives the ISO 3166-1 alpha-2 country code for a canonical GeoStake
 * country. The canonical dataset keys countries on FactsBook GEC (formerly
 * FIPS) codes, so there is no ISO column to read; instead the ISO code is
 * derived deterministically from the country's internet country code field.
 *
 * Returns `null` when no code can be derived so callers can treat the country
 * as having no resolvable visual assets (flag/outline clues become
 * unavailable) rather than crashing.
 */
export function isoCodeOf(
  country: Pick<Country, 'id' | 'internetCountryCode'>,
): string | null {
  const override = GEC_TO_ISO_OVERRIDES[country.id]
  if (override !== undefined) {
    return override
  }
  const match = (country.internetCountryCode ?? '')
    .toLowerCase()
    .match(/\.([a-z]{2})/)
  return match === null ? null : match[1].toUpperCase()
}
