import type { ClueDefinition, ClueId, ClueTier, ClueValue } from '../types/clue'
import type { GeodeAmount, PlayerState } from '../types/player'
import { CLUES, getClueDefinition } from './clueConfig'
import { ECONOMY_CONFIG, type EconomyConfig } from './economyConfig'

export function countPurchasedCluesByTier(
  purchasedClueIds: readonly ClueId[],
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): Partial<Record<ClueTier, number>> {
  const counts: Partial<Record<ClueTier, number>> = {}
  for (const id of purchasedClueIds) {
    const tier = getClueDefinition(id, clues).tier
    counts[tier] = (counts[tier] ?? 0) + 1
  }
  return counts
}

export function calculateRewardDeduction(
  purchasedClueIds: readonly ClueId[],
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): number {
  const counts = countPurchasedCluesByTier(purchasedClueIds, clues)
  let weightedTotal = 0
  for (const [tier, count] of Object.entries(counts)) {
    weightedTotal += Number(tier) * (count ?? 0)
  }
  return weightedTotal
}

export function calculateGuessReward(
  purchasedClueIds: readonly ClueId[],
  economy: EconomyConfig = ECONOMY_CONFIG,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): GeodeAmount {
  const rawReward =
    economy.baseReward -
    economy.baseClueDeduction *
      calculateRewardDeduction(purchasedClueIds, clues)
  return Math.max(economy.minimumReward, rawReward)
}

export function applyGeodeReward(
  player: PlayerState,
  reward: GeodeAmount,
): PlayerState {
  return {
    ...player,
    geodes: player.geodes + reward,
  }
}

export function canPurchaseLife(
  player: PlayerState,
  economy: EconomyConfig = ECONOMY_CONFIG,
): boolean {
  return player.lives < economy.maxLives && player.geodes >= economy.lifeCost
}

export function purchaseLife(
  player: PlayerState,
  economy: EconomyConfig = ECONOMY_CONFIG,
): PlayerState {
  if (!canPurchaseLife(player, economy)) {
    return player
  }
  return {
    geodes: player.geodes - economy.lifeCost,
    lives: player.lives + 1,
  }
}
