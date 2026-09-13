import type { ClueDefinition, ClueId, ClueValue } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { GeodeAmount } from '../types/player'
import { CLUE_COST_MULTIPLIER, CLUES, getClueDefinition } from './clueConfig'
import { pickRandom } from './random'

export function getAvailableClues(
  country: Country,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): readonly ClueDefinition<ClueValue>[] {
  return clues.filter((clue) => clue.isAvailable(country))
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

export function selectStartingClue(
  country: Country,
  random: () => number = Math.random,
  clues: readonly ClueDefinition<ClueValue>[] = CLUES,
): ClueId {
  const tierZeroClues = clues.filter(
    (clue) => clue.tier === 0 && clue.isAvailable(country),
  )
  if (tierZeroClues.length === 0) {
    return 'population'
  }
  return pickRandom(tierZeroClues, random).id
}

export function revealClue(
  state: GameState,
  clueId: ClueId,
  costMultiplier: number = CLUE_COST_MULTIPLIER,
): GameState {
  if (state.guessResult !== null) {
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
  }
}
