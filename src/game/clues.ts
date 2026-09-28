import type { ClueDefinition, ClueId, ClueValue } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { GeodeAmount } from '../types/player'
import {
  CLUE_COST_MULTIPLIER,
  CLUES,
  findClueDefinition,
  getClueDefinition,
  isClueHiddenInUi,
} from './clueConfig'
import { randomIndex } from './random'

export function getAvailableClues(
  country: Country,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): readonly ClueDefinition<ClueValue>[] {
  return clues.filter((clue) => clue.isAvailable(country))
}

/**
 * The clues the panel offers this turn. Free-tier clues are only offered once
 * they have been revealed, which happens for the turn's starting clues and for
 * the free end-of-turn reveal.
 */
export function getTurnClues(
  revealedClueIds: readonly ClueId[],
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): readonly ClueDefinition<ClueValue>[] {
  return clues.filter(
    (clue) => clue.tier !== 0 || revealedClueIds.includes(clue.id),
  )
}

export function isClueAvailable(
  id: ClueId,
  country: Country,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): boolean {
  return getClueDefinition(id, clues).isAvailable(country)
}

export function getClueValue(
  id: ClueId,
  country: Country,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): ClueValue {
  return getClueDefinition(id, clues).getValue(country)
}

export function formatClueValue(
  id: ClueId,
  country: Country,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): string {
  const definition = getClueDefinition(id, clues)
  return definition.formatValue(definition.getValue(country))
}

export function getClueCost(
  id: ClueId,
  costMultiplier: number = CLUE_COST_MULTIPLIER,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): GeodeAmount {
  return getClueDefinition(id, clues).baseCost * costMultiplier
}

export function canAffordClue(
  id: ClueId,
  geodes: GeodeAmount,
  costMultiplier: number = CLUE_COST_MULTIPLIER,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): boolean {
  return geodes >= getClueCost(id, costMultiplier, clues)
}

/** How many free tier-0 clues every turn reveals for free. */
export const STARTING_CLUE_COUNT = 2

/**
 * Picks the turn's free starting clues: up to `count` distinct tier-0 clues
 * that are available for the country. Each pick is removed from the pool, so
 * the same clue is never chosen twice. A smaller pool is used as-is, and an
 * empty pool falls back to `population`, so a turn always starts with a free
 * clue.
 */
export function selectStartingClues(
  country: Country,
  random: () => number = Math.random,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
  count: number = STARTING_CLUE_COUNT,
): readonly ClueId[] {
  const pool = clues.filter(
    (clue) => clue.tier === 0 && clue.isAvailable(country),
  )
  if (pool.length === 0) {
    return ['population']
  }
  const selected: ClueId[] = []
  while (selected.length < count && pool.length > 0) {
    const [picked] = pool.splice(randomIndex(pool.length, random), 1)
    selected.push(picked.id)
  }
  return selected
}

export function revealClue(
  state: GameState,
  clueId: ClueId,
  costMultiplier: number = CLUE_COST_MULTIPLIER,
): GameState {
  if (state.guessResult !== null || state.player.lives <= 0) {
    return state
  }
  const definition = findClueDefinition(clueId)
  if (definition === undefined) {
    return state
  }
  if (definition.tier === 0 && !state.startingClueIds.includes(clueId)) {
    return state
  }
  if (state.revealedClueIds.includes(clueId)) {
    return state
  }
  if (!isClueAvailable(clueId, state.mysteryCountry)) {
    return state
  }
  const cost = getClueCost(clueId, costMultiplier)
  if (state.player.geodes < cost) {
    return state
  }
  return {
    ...state,
    player: {
      ...state.player,
      geodes: state.player.geodes - cost,
    },
    revealedClueIds: [...state.revealedClueIds, clueId],
    purchasedClueIds: [...state.purchasedClueIds, clueId],
  }
}

/**
 * Reveals every remaining available clue for the mystery country, so a finished
 * turn teaches the player about the country. It is free: geodes are untouched
 * and the newly revealed clues are never recorded as purchased, so they cannot
 * change a reward that has already been calculated. Clues that are hidden from
 * the player are skipped, and retired clues are not in `CLUES` at all.
 */
export function revealRemainingClues(state: GameState): GameState {
  const remainingIds = getAvailableClues(state.mysteryCountry)
    .filter((clue) => !isClueHiddenInUi(clue.id))
    .map((clue) => clue.id)
    .filter((clueId) => !state.revealedClueIds.includes(clueId))
  if (remainingIds.length === 0) {
    return state
  }
  return {
    ...state,
    revealedClueIds: [...state.revealedClueIds, ...remainingIds],
  }
}
