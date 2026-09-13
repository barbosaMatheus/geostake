import { CLUES } from '../game/clueConfig'
import { ECONOMY_CONFIG } from '../game/economyConfig'
import type { ClueId } from '../types/clue'
import type { Country } from '../types/country'
import type { GameState } from '../types/game'
import type { GuessResult } from '../types/guess'
import type { PlayerState } from '../types/player'
import {
  localStorageAdapter,
  readJson,
  writeJson,
  type StorageAdapter,
} from './storage'

export const SAVED_GAME_KEY = 'geostake:saved-game'
export const SAVED_GAME_VERSION = 1

const VALID_CLUE_IDS: ReadonlySet<string> = new Set(
  CLUES.map((clue) => clue.id),
)

export interface SavedGuessResult {
  outcome: 'correct' | 'incorrect'
  guessedName: string
  livesRemaining: number
  countryId?: string
  geodesAwarded?: number
}

export interface SavedGameState {
  version: number
  player: PlayerState
  turn: number
  mysteryCountryId: string
  startingClueId: ClueId
  revealedClueIds: readonly ClueId[]
  purchasedClueIds: readonly ClueId[]
  guessResult: SavedGuessResult | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value > 0
}

function isClueId(value: unknown): value is ClueId {
  return typeof value === 'string' && VALID_CLUE_IDS.has(value)
}

function isClueIdList(value: unknown): value is readonly ClueId[] {
  return Array.isArray(value) && value.every(isClueId)
}

function isSavedGuessResult(value: unknown): value is SavedGuessResult {
  if (!isRecord(value)) {
    return false
  }
  if (!isPositiveInteger(value.livesRemaining)) {
    return false
  }
  if (typeof value.guessedName !== 'string' || value.guessedName.length === 0) {
    return false
  }
  if (value.outcome === 'incorrect') {
    return true
  }
  if (value.outcome !== 'correct') {
    return false
  }
  return (
    typeof value.countryId === 'string' &&
    value.countryId.length > 0 &&
    isNonNegativeNumber(value.geodesAwarded)
  )
}

export function isSavedGameState(value: unknown): value is SavedGameState {
  if (!isRecord(value)) {
    return false
  }
  if (value.version !== SAVED_GAME_VERSION) {
    return false
  }
  if (!isRecord(value.player)) {
    return false
  }
  if (!isNonNegativeNumber(value.player.geodes)) {
    return false
  }
  const lives = value.player.lives
  if (!isPositiveInteger(lives) && lives !== 0) {
    return false
  }
  if (lives > ECONOMY_CONFIG.maxLives) {
    return false
  }
  if (!isPositiveInteger(value.turn)) {
    return false
  }
  if (typeof value.mysteryCountryId !== 'string') {
    return false
  }
  if (!isClueId(value.startingClueId)) {
    return false
  }
  if (!isClueIdList(value.revealedClueIds)) {
    return false
  }
  if (!isClueIdList(value.purchasedClueIds)) {
    return false
  }
  if (value.guessResult !== null && !isSavedGuessResult(value.guessResult)) {
    return false
  }
  return isCoherent(value)
}

function isCoherent(value: Record<string, unknown>): boolean {
  const revealed = value.revealedClueIds as readonly ClueId[]
  const purchased = value.purchasedClueIds as readonly ClueId[]
  if (!revealed.includes(value.startingClueId as ClueId)) {
    return false
  }
  for (const id of purchased) {
    if (!revealed.includes(id)) {
      return false
    }
  }
  const guessResult = value.guessResult as SavedGuessResult | null
  if (
    guessResult?.outcome === 'correct' &&
    guessResult.countryId !== value.mysteryCountryId
  ) {
    return false
  }
  return true
}

export function serializeGameState(state: GameState): SavedGameState {
  const guessResult = state.guessResult
  return {
    version: SAVED_GAME_VERSION,
    player: { ...state.player },
    turn: state.turn,
    mysteryCountryId: state.mysteryCountry.id,
    startingClueId: state.startingClueId,
    revealedClueIds: [...state.revealedClueIds],
    purchasedClueIds: [...state.purchasedClueIds],
    guessResult:
      guessResult === null ? null : serializeGuessResult(guessResult),
  }
}

function serializeGuessResult(result: GuessResult): SavedGuessResult {
  if (result.outcome === 'correct') {
    return {
      outcome: 'correct',
      guessedName: result.guessedName,
      countryId: result.country.id,
      livesRemaining: result.livesRemaining,
      geodesAwarded: result.geodesAwarded,
    }
  }
  return {
    outcome: 'incorrect',
    guessedName: result.guessedName,
    livesRemaining: result.livesRemaining,
  }
}

export function restoreGameState(
  saved: SavedGameState,
  countries: readonly Country[],
): GameState | null {
  if (!isSavedGameState(saved)) {
    return null
  }
  const mysteryCountry = countries.find(
    (country) => country.id === saved.mysteryCountryId,
  )
  if (mysteryCountry === undefined) {
    return null
  }
  const guessResult =
    saved.guessResult === null
      ? null
      : restoreGuessResult(saved.guessResult, countries)
  if (saved.guessResult !== null && guessResult === null) {
    return null
  }
  return {
    player: { ...saved.player },
    turn: saved.turn,
    mysteryCountry,
    startingClueId: saved.startingClueId,
    revealedClueIds: [...saved.revealedClueIds],
    purchasedClueIds: [...saved.purchasedClueIds],
    guessResult,
  }
}

function restoreGuessResult(
  saved: SavedGuessResult,
  countries: readonly Country[],
): GuessResult | null {
  if (saved.outcome === 'incorrect') {
    return {
      outcome: 'incorrect',
      guessedName: saved.guessedName,
      livesRemaining: saved.livesRemaining,
    }
  }
  const country = countries.find((c) => c.id === saved.countryId)
  if (country === undefined) {
    return null
  }
  return {
    outcome: 'correct',
    guessedName: saved.guessedName,
    country,
    livesRemaining: saved.livesRemaining,
    geodesAwarded: saved.geodesAwarded ?? 0,
  }
}

export function loadSavedGame(
  adapter: StorageAdapter = localStorageAdapter,
): SavedGameState | null {
  const value = readJson<unknown>(SAVED_GAME_KEY, adapter)
  return isSavedGameState(value) ? value : null
}

export function loadResumableGame(
  countries: readonly Country[],
  adapter: StorageAdapter = localStorageAdapter,
): GameState | null {
  const saved = loadSavedGame(adapter)
  if (saved === null) {
    return null
  }
  return restoreGameState(saved, countries)
}

export function saveGame(
  state: GameState,
  adapter: StorageAdapter = localStorageAdapter,
): boolean {
  if (state.player.lives === 0) {
    clearSavedGame(adapter)
    return false
  }
  return writeJson(SAVED_GAME_KEY, serializeGameState(state), adapter)
}

export function clearSavedGame(
  adapter: StorageAdapter = localStorageAdapter,
): void {
  try {
    adapter.removeItem(SAVED_GAME_KEY)
  } catch {
    // Storage failures are already handled by surviving code paths.
  }
}

export function savedGameExists(
  adapter: StorageAdapter = localStorageAdapter,
): boolean {
  return loadSavedGame(adapter) !== null
}
