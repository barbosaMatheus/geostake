import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ECONOMY_CONFIG } from '../game/economyConfig'
import { GAME_CONFIG } from '../game/config'
import { createInitialGameState } from '../game/game'
import { TUTORIAL_COUNTRY_ID } from '../game/tutorial'
import { loadResumableGame, savedGameExists } from '../persistence/savedGame'
import { TEST_COUNTRIES } from '../tests/fixtures'
import { createMemoryStorage } from '../tests/memoryStorage'
import { useTutorial } from './useTutorial'

const alwaysSelectFirst = () => 0

describe('useTutorial', () => {
  it('starts with Brazil at 1000 geodes and 3 lives', () => {
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    expect(result.current.tutorialState.game.mysteryCountry.id).toBe('br')
    expect(result.current.tutorialState.game.mysteryCountry.name).toBe('Brazil')
    expect(result.current.tutorialState.game.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes,
    )
    expect(result.current.tutorialState.game.player.lives).toBe(
      ECONOMY_CONFIG.startingLives,
    )
    expect(result.current.tutorialState.game.turn).toBe(1)
  })

  it('accepts a correct guess and awards geodes only within the tutorial', () => {
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    act(() => {
      result.current.submitGuess('Brazil')
    })

    expect(result.current.tutorialState.game.guessResult?.outcome).toBe('correct')
    expect(result.current.tutorialState.game.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes + ECONOMY_CONFIG.baseReward,
    )
    expect(result.current.lastIncorrectGuess).toBeNull()
  })

  it('deducts geodes and loses a life inside the tutorial like the regular game', () => {
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    act(() => {
      result.current.revealClue('region')
    })
    expect(result.current.tutorialState.game.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes - 50,
    )

    act(() => {
      result.current.submitGuess('Atlantis')
    })
    expect(result.current.tutorialState.game.player.lives).toBe(
      ECONOMY_CONFIG.startingLives - 1,
    )
    expect(result.current.tutorialState.game.guessResult).toBeNull()
    expect(result.current.lastIncorrectGuess).toEqual({
      guessedName: 'Atlantis',
      livesRemaining: 2,
    })
  })

  it('reset returns the tutorial to its starting state', () => {
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    act(() => {
      result.current.submitGuess('Brazil')
    })
    expect(result.current.tutorialState.game.player.geodes).toBe(1500)

    act(() => {
      result.current.reset()
    })

    expect(result.current.tutorialState.game.mysteryCountry.id).toBe('br')
    expect(result.current.tutorialState.game.player.geodes).toBe(
      ECONOMY_CONFIG.startingGeodes,
    )
    expect(result.current.tutorialState.game.player.lives).toBe(
      ECONOMY_CONFIG.startingLives,
    )
    expect(result.current.tutorialState.game.turn).toBe(1)
    expect(result.current.tutorialState.game.guessResult).toBeNull()
    expect(result.current.lastIncorrectGuess).toBeNull()
  })

  it('never creates or modifies a saved game', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    act(() => {
      result.current.revealClue('capital')
    })
    act(() => {
      result.current.submitGuess('Atlantis')
    })
    act(() => {
      result.current.submitGuess('Atlantis')
    })
    act(() => {
      result.current.reset()
    })

    expect(storage.size).toBe(0)
    expect(savedGameExists(storage)).toBe(false)
    expect(loadResumableGame(TEST_COUNTRIES, storage)).toBeNull()
  })

  it('keeps tutorial progress independent from a normal game state', () => {
    const { result } = renderHook(() =>
      useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
    )

    act(() => {
      result.current.revealClue('capital')
    })
    act(() => {
      result.current.submitGuess('Atlantis')
    })

    const tutorial = result.current.tutorialState.game
    const normal = createInitialGameState(
      TEST_COUNTRIES,
      GAME_CONFIG,
      alwaysSelectFirst,
    )

    expect(tutorial.player.geodes).not.toBe(normal.player.geodes)
    expect(tutorial.player.lives).not.toBe(normal.player.lives)
    expect(normal.player.geodes).toBe(ECONOMY_CONFIG.startingGeodes)
    expect(normal.player.lives).toBe(ECONOMY_CONFIG.startingLives)
    expect(tutorial.turn).toBe(1)
    expect(tutorial.mysteryCountry.id).toBe(TUTORIAL_COUNTRY_ID)
  })
})