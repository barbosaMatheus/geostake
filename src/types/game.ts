import type { ClueId } from './clue'
import type { Country } from './country'
import type { GuessResult } from './guess'
import type { PlayerState } from './player'

export interface GameState {
  player: PlayerState
  mysteryCountry: Country
  turn: number
  guessResult: GuessResult | null
  startingClueId: ClueId
  revealedClueIds: readonly ClueId[]
}
