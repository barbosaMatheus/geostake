import { describe, expect, it } from 'vitest'
import type { ClueDefinition, ClueId, ClueValue } from '../types/clue'
import type { PlayerState } from '../types/player'
import {
  applyGeodeReward,
  calculateGuessReward,
  calculateRewardDeduction,
  canPurchaseLife,
  countPurchasedCluesByTier,
  purchaseLife,
} from './economy'
import { ECONOMY_CONFIG } from './economyConfig'

function player(geodes: number, lives: number): PlayerState {
  return { geodes, lives }
}

function clueAt(id: ClueId, tier: number): ClueDefinition<ClueValue> {
  return {
    id,
    tier,
    baseCost: 0,
    label: id,
    isAvailable: () => true,
    getValue: () => id,
    formatValue: (value) => String(value),
  }
}

/**
 * A fixed tier layout, so the reward formula's "weight = tier number" rule is
 * tested independently of the real clue configuration in `clueConfig.ts`.
 */
const TIERED_CLUES: readonly ClueDefinition<ClueValue>[] = [
  clueAt('population', 0),
  clueAt('region', 1),
  clueAt('coastline', 2),
  clueAt('capital', 3),
  clueAt('internet-country-code', 4),
]

const generousConfig = {
  ...ECONOMY_CONFIG,
  baseReward: 1000,
  baseClueDeduction: 100,
  minimumReward: 0,
  lifeCost: 100,
}

describe('countPurchasedCluesByTier', () => {
  it('returns an empty count for no purchased clues', () => {
    expect(countPurchasedCluesByTier([])).toEqual({})
  })

  it('counts clues grouped by tier', () => {
    expect(
      countPurchasedCluesByTier(
        ['region', 'coastline', 'capital'],
        TIERED_CLUES,
      ),
    ).toEqual({ 1: 1, 2: 1, 3: 1 })
  })
})

describe('reward weights for the configured clue tiers', () => {
  it('weighs each configured clue by the tier it currently belongs to', () => {
    expect(countPurchasedCluesByTier(['hemisphere', 'coastline'])).toEqual({
      0: 2,
    })
    expect(countPurchasedCluesByTier(['region', 'highest-elevation'])).toEqual({
      1: 2,
    })
    expect(countPurchasedCluesByTier(['national-colors'])).toEqual({ 2: 1 })
    expect(countPurchasedCluesByTier(['capital'])).toEqual({ 3: 1 })
    expect(countPurchasedCluesByTier(['country-flag'])).toEqual({ 4: 1 })
  })
})

describe('calculateRewardDeduction', () => {
  it('returns zero when nothing was purchased', () => {
    expect(calculateRewardDeduction([])).toBe(0)
  })

  it('weights each purchased clue by its tier', () => {
    expect(
      calculateRewardDeduction(
        [
          'population',
          'region',
          'coastline',
          'capital',
          'internet-country-code',
        ],
        TIERED_CLUES,
      ),
    ).toBe(10)
  })

  it('ignores free-tier clues in the weighting', () => {
    expect(
      calculateRewardDeduction(['population', 'region'], TIERED_CLUES),
    ).toBe(1)
  })
})

describe('calculateGuessReward', () => {
  it('awards the full base reward with no purchased clues', () => {
    expect(calculateGuessReward([])).toBe(500)
  })

  it('subtracts the deduction for a single tier-one clue', () => {
    expect(calculateGuessReward(['region'], ECONOMY_CONFIG, TIERED_CLUES)).toBe(
      490,
    )
  })

  it('subtracts the combined deduction for one clue per tier up to four', () => {
    expect(
      calculateGuessReward(
        ['region', 'coastline', 'capital', 'internet-country-code'],
        ECONOMY_CONFIG,
        TIERED_CLUES,
      ),
    ).toBe(400)
  })

  it('subtracts each tier count times its tier weight', () => {
    expect(
      calculateGuessReward(['region', 'capital'], ECONOMY_CONFIG, TIERED_CLUES),
    ).toBe(460)
    expect(
      calculateGuessReward(
        ['coastline', 'coastline'],
        ECONOMY_CONFIG,
        TIERED_CLUES,
      ),
    ).toBe(460)
  })

  it('applies the configured reward values', () => {
    expect(calculateGuessReward(['region'], generousConfig, TIERED_CLUES)).toBe(
      900,
    )
  })

  it('never returns less than the configured minimum reward', () => {
    const harshConfig = { ...ECONOMY_CONFIG, baseClueDeduction: 200 }
    const heavyLoad = calculateGuessReward(
      ['region', 'coastline', 'capital', 'internet-country-code'],
      harshConfig,
      TIERED_CLUES,
    )
    expect(heavyLoad).toBe(harshConfig.minimumReward)

    const lightLoad = calculateGuessReward(
      ['region'],
      harshConfig,
      TIERED_CLUES,
    )
    expect(lightLoad).toBeGreaterThan(harshConfig.minimumReward)
  })

  it('respects a zero minimum reward configuration', () => {
    const zeroMinimum = { ...ECONOMY_CONFIG, minimumReward: 0 }
    expect(calculateGuessReward([], zeroMinimum)).toBe(500)
  })

  it('weights future tiers automatically by their tier number', () => {
    const tierFiveClues: readonly ClueDefinition<ClueValue>[] = [
      clueAt('population', 0),
      clueAt('internet-country-code', 5),
    ]

    expect(
      calculateGuessReward(
        ['internet-country-code'],
        ECONOMY_CONFIG,
        tierFiveClues,
      ),
    ).toBe(450)
  })
})

describe('applyGeodeReward', () => {
  it('adds the reward to the player geodes', () => {
    expect(applyGeodeReward(player(1000, 3), 500)).toEqual({
      geodes: 1500,
      lives: 3,
    })
  })

  it('leaves geodes unchanged when the reward is zero', () => {
    expect(applyGeodeReward(player(1000, 3), 0)).toEqual({
      geodes: 1000,
      lives: 3,
    })
  })
})

describe('canPurchaseLife', () => {
  it('allows a purchase within geodes and below max lives', () => {
    expect(canPurchaseLife(player(1000, 3))).toBe(true)
  })

  it('rejects a purchase without enough geodes', () => {
    expect(canPurchaseLife(player(ECONOMY_CONFIG.lifeCost - 1, 3))).toBe(false)
  })

  it('rejects a purchase at the maximum life count', () => {
    expect(canPurchaseLife(player(1000, ECONOMY_CONFIG.maxLives))).toBe(false)
  })

  it('allows a purchase one below the maximum life count', () => {
    expect(canPurchaseLife(player(1000, ECONOMY_CONFIG.maxLives - 1))).toBe(
      true,
    )
  })

  it('uses a custom life cost when provided', () => {
    expect(canPurchaseLife(player(99, 3), generousConfig)).toBe(false)
    expect(canPurchaseLife(player(100, 3), generousConfig)).toBe(true)
  })
})

describe('purchaseLife', () => {
  it('deducts the life cost and restores a life', () => {
    expect(purchaseLife(player(1000, 3))).toEqual({ geodes: 250, lives: 4 })
  })

  it('does not change the player when the life cost is unaffordable', () => {
    const poor = player(ECONOMY_CONFIG.lifeCost - 1, 3)
    expect(purchaseLife(poor)).toBe(poor)
  })

  it('does not exceed the maximum life count', () => {
    expect(purchaseLife(player(1000, ECONOMY_CONFIG.maxLives))).toEqual({
      geodes: 1000,
      lives: ECONOMY_CONFIG.maxLives,
    })
  })

  it('never produces negative geodes', () => {
    const broke = player(0, 1)
    expect(purchaseLife(broke)).toBe(broke)
  })
})
