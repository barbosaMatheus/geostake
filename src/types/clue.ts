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

export type ClueTier = number

export type ClueValue = number | string | readonly string[]

export interface ClueDefinition<Value extends ClueValue = ClueValue> {
  id: ClueId
  tier: ClueTier
  baseCost: GeodeAmount
  label: string
  isAvailable(country: Country): boolean
  getValue(country: Country): Value
  formatValue(value: Value): string
}
