import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { GuessResult } from '../types/guess'
import { GAME_CONFIG, type GameConfig } from './config'
import { selectStartingClue } from './clues'
import { applyGeodeReward, calculateGuessReward } from './economy'
import { ECONOMY_CONFIG, type EconomyConfig } from './economyConfig'
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
      geodes: config.economy.startingGeodes,
      lives: config.economy.startingLives,
    },
    mysteryCountry,
    turn: 1,
    guessResult: null,
    startingClueId,
    revealedClueIds: [startingClueId],
    purchasedClueIds: [],
  }
}

export function applyGuess(
  state: GameState,
  guessedName: string,
  economy: EconomyConfig = ECONOMY_CONFIG,
): GameState {
  if (state.guessResult !== null) {
    return state
  }
  const correct = isCorrectGuess(guessedName, state.mysteryCountry)
  if (!correct) {
    const player = {
      ...state.player,
      lives: Math.max(0, state.player.lives - 1),
    }
    if (player.lives > 0) {
      return { ...state, player }
    }
    const guessResult: GuessResult = {
      outcome: 'incorrect',
      guessedName,
      livesRemaining: 0,
    }
    return { ...state, player, guessResult }
  }
  const reward = calculateGuessReward(state.purchasedClueIds, economy)
  const player = applyGeodeReward(state.player, reward)
  const guessResult: GuessResult = {
    outcome: 'correct',
    guessedName,
    country: state.mysteryCountry,
    livesRemaining: player.lives,
    geodesAwarded: reward,
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
  const afterGuess = applyGuess(state, guessedName, config.economy)
  if (
    config.continueOnCorrectGuess &&
    afterGuess.guessResult?.outcome === 'correct'
  ) {
    return startNextTurn(afterGuess, countries, random, config)
  }
  return afterGuess
}

export function startNextTurn(
  state: GameState,
  countries: readonly Country[],
  random: () => number = Math.random,
  config: GameConfig = GAME_CONFIG,
): GameState {
  if (state.guessResult === null && state.player.lives > 0) {
    return state
  }
  if (countries.length === 0) {
    throw new Error('Cannot start a new turn without any countries')
  }
  if (state.player.lives <= 0) {
    return createInitialGameState(countries, config, random)
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
    purchasedClueIds: [],
  }
}

/**
 * Advances to a brand-new turn unconditionally, used by the temporary debug
 * Skip action. Unlike `startNextTurn` it works mid-turn and never spends,
 * awards, or deducts anything: geodes and lives are preserved untouched. Turn
 * state (mystery country, clues, guesses, feedback) is reset as a normal new
 * turn.
 */
export function skipTurn(
  state: GameState,
  countries: readonly Country[],
  random: () => number = Math.random,
): GameState {
  if (countries.length === 0) {
    throw new Error('Cannot skip to a new turn without any countries')
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
    purchasedClueIds: [],
  }
}
