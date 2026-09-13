import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { GuessResult } from '../types/guess'
import { GAME_CONFIG, type GameConfig } from './config'
import { selectStartingClue } from './clues'
import { selectMysteryCountry } from './selectCountry'

export function normalizeCountryName(name: string): string {
  return name.trim().toLowerCase()
}

export function isCorrectGuess(guess: string, country: Country): boolean {
  return normalizeCountryName(guess) === normalizeCountryName(country.name)
}

export function createInitialGameState(
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random: () => number = Math.random,
): GameState {
  if (countries.length === 0) {
    throw new Error('Cannot start a game without any countries')
  }
  const mysteryCountry = selectMysteryCountry(countries, random)
  const startingClueId = selectStartingClue(mysteryCountry, random)
  return {
    player: {
      geodes: config.startingGeodes,
      lives: config.startingLives,
    },
    mysteryCountry,
    turn: 1,
    guessResult: null,
    startingClueId,
    revealedClueIds: [startingClueId],
  }
}

export function applyGuess(state: GameState, guessedName: string): GameState {
  if (state.guessResult !== null) {
    return state
  }
  const correct = isCorrectGuess(guessedName, state.mysteryCountry)
  const player = {
    ...state.player,
    lives: Math.max(0, state.player.lives - (correct ? 0 : 1)),
  }
  const guessResult: GuessResult = correct
    ? {
        outcome: 'correct',
        guessedName,
        country: state.mysteryCountry,
        livesRemaining: player.lives,
      }
    : {
        outcome: 'incorrect',
        guessedName,
        livesRemaining: player.lives,
      }
  return { ...state, player, guessResult }
}

export function resolveGuess(
  state: GameState,
  guessedName: string,
  countries: readonly Country[],
  config: GameConfig = GAME_CONFIG,
  random: () => number = Math.random,
): GameState {
  if (state.guessResult !== null) {
    return state
  }
  const afterGuess = applyGuess(state, guessedName)
  if (
    config.continueOnCorrectGuess &&
    afterGuess.guessResult?.outcome === 'correct'
  ) {
    return startNextTurn(afterGuess, countries, random)
  }
  return afterGuess
}

export function startNextTurn(
  state: GameState,
  countries: readonly Country[],
  random: () => number = Math.random,
): GameState {
  if (state.guessResult === null) {
    return state
  }
  if (countries.length === 0) {
    throw new Error('Cannot start a new turn without any countries')
  }
  const mysteryCountry = selectMysteryCountry(countries, random)
  const startingClueId = selectStartingClue(mysteryCountry, random)
  return {
    ...state,
    turn: state.turn + 1,
    mysteryCountry,
    guessResult: null,
    startingClueId,
    revealedClueIds: [startingClueId],
  }
}
