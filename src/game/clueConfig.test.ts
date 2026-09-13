import { describe, expect, it } from 'vitest'
import type { ClueId } from '../types/clue'
import {
  CLUES,
  CLUE_COST_MULTIPLIER,
  getClueKind,
  getClueTiers,
} from './clueConfig'
import { getClueCost } from './clues'

const expectedTiers: Record<ClueId, number> = {
  population: 0,
  'land-area': 0,
  'population-density': 0,
  'lowest-elevation': 0,
  region: 1,
  hemisphere: 1,
  coastline: 2,
  'highest-elevation': 2,
  capital: 3,
  'national-colors': 3,
  'internet-country-code': 4,
  'country-flag': 4,
  'country-outline': 3,
}

const expectedBaseCosts: Record<ClueId, number> = {
  population: 0,
  'land-area': 0,
  'population-density': 0,
  'lowest-elevation': 0,
  region: 10,
  hemisphere: 10,
  coastline: 20,
  'highest-elevation': 20,
  capital: 50,
  'national-colors': 50,
  'internet-country-code': 75,
  'country-flag': 75,
  'country-outline': 50,
}

const expectedKinds: Record<ClueId, 'text' | 'flag' | 'outline'> = {
  population: 'text',
  'land-area': 'text',
  'population-density': 'text',
  'lowest-elevation': 'text',
  region: 'text',
  hemisphere: 'text',
  coastline: 'text',
  'highest-elevation': 'text',
  capital: 'text',
  'national-colors': 'text',
  'internet-country-code': 'text',
  'country-flag': 'flag',
  'country-outline': 'outline',
}

describe('CLUES', () => {
  it('defines every expected clue with a unique id', () => {
    const ids = CLUES.map((clue) => clue.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(Object.keys(expectedTiers))
  })

  it('assigns every clue its correct tier', () => {
    for (const clue of CLUES) {
      expect(clue.tier).toBe(expectedTiers[clue.id])
    }
  })

  it('assigns every clue its correct base cost', () => {
    for (const clue of CLUES) {
      expect(clue.baseCost).toBe(expectedBaseCosts[clue.id])
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

  it('keeps the existing Tier 3 and Tier 4 costs unchanged', () => {
    expect(getClueCost('capital')).toBe(250)
    expect(getClueCost('national-colors')).toBe(250)
    expect(getClueCost('country-outline')).toBe(250)
    expect(getClueCost('internet-country-code')).toBe(375)
    expect(getClueCost('country-flag')).toBe(375)
  })

  it('exposes the five expected tiers in ascending order', () => {
    expect(getClueTiers(CLUES)).toEqual([0, 1, 2, 3, 4])
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

  it('charges nothing for tier zero clues', () => {
    for (const clue of CLUES.filter((clue) => clue.tier === 0)) {
      expect(clue.baseCost).toBe(0)
      expect(getClueCost(clue.id)).toBe(0)
    }
  })
})
