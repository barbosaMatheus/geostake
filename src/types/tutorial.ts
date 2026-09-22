import type { GameState } from './game'

/**
 * Tutorial progress, kept deliberately separate from the regular `GameState`.
 * The wrapped game board is always built around the fixed tutorial country
 * (Brazil) and is never persisted, so tutorial play can never touch the
 * player's real game, its resources, or its saved game.
 */
export interface TutorialState {
  game: GameState
}