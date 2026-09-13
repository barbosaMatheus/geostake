import type { Country } from './country'
import type { GeodeAmount } from './player'

export type ClueId =
  | 'population'
  | 'land-area'
  | 'population-density'
  | 'coastline'
  | 'region'
  | 'hemisphere'
  | 'lowest-elevation'
  | 'highest-elevation'
  | 'capital'
  | 'national-colors'
  | 'internet-country-code'
  | 'country-outline'
  | 'country-flag'

export type ClueTier = number

export type ClueValue = number | string | readonly string[]

/**
 * How a revealed clue's content is presented. Text clues render a formatted
 * string; flag and outline clues render visual assets. When omitted, a clue is
 * treated as `'text'`.
 */
export type ClueKind = 'text' | 'flag' | 'outline'

export interface ClueDefinition<Value extends ClueValue = ClueValue> {
  id: ClueId
  tier: ClueTier
  baseCost: GeodeAmount
  label: string
  kind?: ClueKind
  isAvailable(country: Country): boolean
  getValue(country: Country): Value
  formatValue(value: Value): string
}
