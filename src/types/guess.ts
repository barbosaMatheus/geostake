import type { Country } from './country'
import type { LifeCount } from './player'

export interface CorrectGuessResult {
  outcome: 'correct'
  guessedName: string
  country: Country
  livesRemaining: LifeCount
}

export interface IncorrectGuessResult {
  outcome: 'incorrect'
  guessedName: string
  livesRemaining: LifeCount
}

export type GuessResult = CorrectGuessResult | IncorrectGuessResult
