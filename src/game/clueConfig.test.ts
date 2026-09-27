import { describe, expect, it } from 'vitest'
import type { ClueId } from '../types/clue'
import {
  CLUES,
  CLUES_HIDDEN_IN_UI,
  CLUE_COST_MULTIPLIER,
  getClueKind,
  getCluesForTier,
  getClueTiers,
  isClueHiddenInUi,
} from './clueConfig'
import { getClueCost } from './clues'

const expectedTiers: Record<ClueId, number> = {
  population: 0,
  'land-area': 0,
  'population-density': 0,
  coastline: 0,
  hemisphere: 0,
  region: 1,
  'highest-elevation': 1,
  'national-colors': 2,
  capital: 3,
  'country-outline': 3,
  'internet-country-code': 4,
  'country-flag': 4,
}

const expectedTierMembers: Record<number, readonly ClueId[]> = {
  0: [
    'population',
    'land-area',
    'population-density',
    'coastline',
    'hemisphere',
  ],
  1: ['region', 'highest-elevation'],
  2: ['national-colors'],
  3: ['capital', 'country-outline'],
  4: ['internet-country-code', 'country-flag'],
}

const expectedBaseCosts: Record<ClueId, number> = {
  population: 0,
  'land-area': 0,
  'population-density': 0,
  coastline: 0,
  hemisphere: 0,
  region: 10,
  'highest-elevation': 20,
  'national-colors': 50,
  capital: 50,
  'internet-country-code': 75,
  'country-flag': 75,
  'country-outline': 50,
}

const expectedCosts: Record<ClueId, number> = {
  population: 0,
  'land-area': 0,
  'population-density': 0,
  coastline: 0,
  hemisphere: 0,
  region: 50,
  'highest-elevation': 100,
  'national-colors': 250,
  capital: 250,
  'internet-country-code': 375,
  'country-flag': 375,
  'country-outline': 250,
}

const expectedKinds: Record<ClueId, 'text' | 'flag' | 'outline'> = {
  population: 'text',
  'land-area': 'text',
  'population-density': 'text',
  coastline: 'text',
  hemisphere: 'text',
  region: 'text',
  'highest-elevation': 'text',
  'national-colors': 'text',
  capital: 'text',
  'internet-country-code': 'text',
  'country-flag': 'flag',
  'country-outline': 'outline',
}

describe('CLUES', () => {
  it('defines every expected clue with a unique id', () => {
    const ids = CLUES.map((clue) => clue.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(ids)).toEqual(new Set(Object.keys(expectedTiers)))
  })

  it('assigns every clue its correct tier', () => {
    for (const clue of CLUES) {
      expect(clue.tier).toBe(expectedTiers[clue.id])
    }
  })

  it('groups exactly the expected clues under each tier', () => {
    for (const tier of getClueTiers(CLUES)) {
      const actual = getCluesForTier(tier)
        .map((clue) => clue.id)
        .sort()
      expect(actual).toEqual([...expectedTierMembers[tier]].sort())
    }
  })

  it('places hemisphere, highest elevation, and national colors in their tiers', () => {
    expect(expectedTiers.hemisphere).toBe(0)
    expect(expectedTiers['highest-elevation']).toBe(1)
    expect(expectedTiers['national-colors']).toBe(2)
    expect(getCluesForTier(0).map((clue) => clue.id)).toContain('hemisphere')
    expect(getCluesForTier(1).map((clue) => clue.id)).toContain(
      'highest-elevation',
    )
    expect(getCluesForTier(2).map((clue) => clue.id)).toContain(
      'national-colors',
    )
  })

  it('assigns every clue its correct base cost', () => {
    for (const clue of CLUES) {
      expect(clue.baseCost).toBe(expectedBaseCosts[clue.id])
    }
  })

  it('keeps every in-game clue cost unchanged', () => {
    for (const clue of CLUES) {
      expect(getClueCost(clue.id), `cost for ${clue.id}`).toBe(
        expectedCosts[clue.id],
      )
    }
  })

  it('assigns every clue its correct display kind', () => {
    for (const clue of CLUES) {
      expect(getClueKind(clue.id)).toBe(expectedKinds[clue.id])
    }
  })

  it('marks only the visual clues as non-text', () => {
    const visual = CLUES.filter(
      (clue) => clue.kind === 'flag' || clue.kind === 'outline',
    )
    expect(visual.map((clue) => clue.id).sort()).toEqual([
      'country-flag',
      'country-outline',
    ])
  })

  it('exposes the five expected tiers in ascending order', () => {
    expect(getClueTiers(CLUES)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('retired clues', () => {
  it('no longer configures the lowest elevation clue', () => {
    const ids = CLUES.map((clue) => clue.id)

    expect(ids).not.toContain('lowest-elevation')
    expect(CLUES.some((clue) => clue.label === 'Lowest Elevation')).toBe(false)
  })

  it('keeps every other tier populated', () => {
    for (const tier of getClueTiers(CLUES)) {
      expect(CLUES.filter((clue) => clue.tier === tier).length).toBeGreaterThan(
        0,
      )
    }
  })
})

describe('CLUES_HIDDEN_IN_UI', () => {
  it('hides only the country outline from the player-facing panel', () => {
    expect(Array.from(CLUES_HIDDEN_IN_UI)).toEqual(['country-outline'])
    expect(isClueHiddenInUi('country-outline')).toBe(true)
  })

  it('keeps every other clue visible in the player-facing panel', () => {
    const visible = CLUES.filter((clue) => !isClueHiddenInUi(clue.id))

    expect(visible.map((clue) => clue.id)).toContain('country-flag')
    expect(visible.map((clue) => clue.id)).toContain('capital')
    expect(visible.map((clue) => clue.id)).toContain('population')
    expect(visible.map((clue) => clue.id)).toHaveLength(CLUES.length - 1)
  })

  it('leaves the hidden outline clue fully configured and purchasable', () => {
    const outline = CLUES.find((clue) => clue.id === 'country-outline')

    expect(outline).toBeDefined()
    expect(outline?.tier).toBe(3)
    expect(outline?.baseCost).toBe(50)
    expect(getClueKind('country-outline')).toBe('outline')
    expect(getClueCost('country-outline')).toBe(250)
  })
})

describe('clue cost multiplier', () => {
  it('defaults to 5', () => {
    expect(CLUE_COST_MULTIPLIER).toBe(5)
  })

  it('multiplies the base cost by the multiplier for every clue', () => {
    for (const clue of CLUES) {
      expect(getClueCost(clue.id)).toBe(clue.baseCost * CLUE_COST_MULTIPLIER)
    }
  })

  it('accepts an explicit multiplier', () => {
    expect(getClueCost('capital', 10)).toBe(500)
    expect(getClueCost('region', 1)).toBe(10)
  })

  it('keeps the free tier free', () => {
    for (const clue of CLUES.filter((clue) => clue.tier === 0)) {
      expect(clue.baseCost, `base cost for ${clue.id}`).toBe(0)
      expect(getClueCost(clue.id), `cost for ${clue.id}`).toBe(0)
    }
  })

  it('keeps a tier 0 clue free even when its neighbours stay priced', () => {
    expect(expectedTiers.coastline).toBe(0)
    expect(expectedTiers.hemisphere).toBe(0)
    expect(getClueCost('coastline')).toBe(0)
    expect(getClueCost('hemisphere')).toBe(0)
    expect(getClueCost('region')).toBe(50)
    expect(getClueCost('highest-elevation')).toBe(100)
  })
})
