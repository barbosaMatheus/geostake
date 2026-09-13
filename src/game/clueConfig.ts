import type { ClueDefinition, ClueId, ClueTier, ClueValue } from '../types/clue'

export const CLUE_COST_MULTIPLIER = 5

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

export const CLUES: readonly ClueDefinition<ClueValue>[] = [
  {
    id: 'population',
    tier: 0,
    baseCost: 0,
    label: 'Population',
    isAvailable: () => true,
    getValue: (country) => country.population,
    formatValue: (value) => formatNumber(value),
  } satisfies ClueDefinition<number>,
  {
    id: 'land-area',
    tier: 0,
    baseCost: 0,
    label: 'Land Area',
    isAvailable: () => true,
    getValue: (country) => country.landAreaKm2,
    formatValue: (value) => `${formatNumber(value)} km²`,
  } satisfies ClueDefinition<number>,
  {
    id: 'population-density',
    tier: 0,
    baseCost: 0,
    label: 'Population Density',
    isAvailable: () => true,
    getValue: (country) => country.populationDensity,
    formatValue: (value) => `${formatDecimal(value)} per km²`,
  } satisfies ClueDefinition<number>,
  {
    id: 'coastline',
    tier: 0,
    baseCost: 0,
    label: 'Coastline',
    isAvailable: (country) => country.coastlineKm !== undefined,
    getValue: (country) => country.coastlineKm as number,
    formatValue: (value) => `${formatNumber(value)} km`,
  } satisfies ClueDefinition<number>,
  {
    id: 'region',
    tier: 1,
    baseCost: 10,
    label: 'Region',
    isAvailable: () => true,
    getValue: (country) => country.region,
    formatValue: (value) => value,
  } satisfies ClueDefinition<string>,
  {
    id: 'hemisphere',
    tier: 1,
    baseCost: 10,
    label: 'Hemisphere',
    isAvailable: () => true,
    getValue: (country) => country.hemisphere,
    formatValue: (value) => value,
  } satisfies ClueDefinition<string>,
  {
    id: 'lowest-elevation',
    tier: 2,
    baseCost: 20,
    label: 'Lowest Elevation',
    isAvailable: (country) => country.lowestElevationM !== undefined,
    getValue: (country) => country.lowestElevationM as number,
    formatValue: (value) => `${formatNumber(value)} m`,
  } satisfies ClueDefinition<number>,
  {
    id: 'highest-elevation',
    tier: 2,
    baseCost: 20,
    label: 'Highest Elevation',
    isAvailable: (country) => country.highestElevationM !== undefined,
    getValue: (country) => country.highestElevationM as number,
    formatValue: (value) => `${formatNumber(value)} m`,
  } satisfies ClueDefinition<number>,
  {
    id: 'capital',
    tier: 3,
    baseCost: 50,
    label: 'Capital',
    isAvailable: () => true,
    getValue: (country) => country.capital,
    formatValue: (value) => value,
  } satisfies ClueDefinition<string>,
  {
    id: 'national-colors',
    tier: 3,
    baseCost: 50,
    label: 'National Colors',
    isAvailable: (country) => country.nationalColors !== undefined,
    getValue: (country) => country.nationalColors as readonly string[],
    formatValue: (value) => value.join(', '),
  } satisfies ClueDefinition<readonly string[]>,
  {
    id: 'internet-country-code',
    tier: 4,
    baseCost: 75,
    label: 'Internet Country Code',
    isAvailable: (country) => country.internetCountryCode !== undefined,
    getValue: (country) => country.internetCountryCode as string,
    formatValue: (value) => value,
  } satisfies ClueDefinition<string>,
]

const TIER_LABELS: Record<number, string> = {
  0: 'Free',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High',
}

export function getTierLabel(tier: ClueTier): string {
  return TIER_LABELS[tier] ?? `Tier ${tier}`
}

export function getClueDefinition(
  id: ClueId,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): ClueDefinition<ClueValue> {
  const definition = clues.find((clue) => clue.id === id)
  if (definition === undefined) {
    throw new Error(`No clue definition exists for "${id}"`)
  }
  return definition
}

export function getClueTiers(
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): readonly ClueTier[] {
  const tiers = new Set<ClueTier>()
  for (const clue of clues) {
    tiers.add(clue.tier)
  }
  return Array.from(tiers).sort((a, b) => a - b)
}

export function getCluesForTier(
  tier: ClueTier,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): readonly ClueDefinition<ClueValue>[] {
  return clues.filter((clue) => clue.tier === tier)
}

export function getClueLabel(id: ClueId): string {
  return getClueDefinition(id).label
}
