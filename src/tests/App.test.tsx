import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { GAME_CONFIG } from '../game/config'
import { createInitialGameState } from '../game/game'
import { COUNTRIES } from '../data/countries'
import {
  loadResumableGame,
  SAVED_GAME_KEY,
  savedGameExists,
  saveGame,
} from '../persistence/savedGame'
import { createMemoryStorage, type MemoryStorage } from './memoryStorage'

const selectFirst = () => 0

function renderApp(storage: MemoryStorage) {
  render(<App storage={storage} />)
}

function seedSavedGame(geodes = 1150) {
  const state = createInitialGameState(COUNTRIES, GAME_CONFIG, selectFirst)
  state.player.geodes = geodes
  saveGame(state, storage)
  return state
}

let storage: MemoryStorage

beforeEach(() => {
  storage = createMemoryStorage()
})

function getLandingButtons() {
  return {
    newGame: screen.getByRole('button', { name: /^new game$/i }),
    continueGame: screen.getByRole('button', { name: /continue game/i }),
    settings: screen.getByRole('button', { name: /^settings$/i }),
  }
}

describe('App landing and navigation', () => {
  it('shows the Landing screen with Continue Game disabled when no save exists', () => {
    renderApp(storage)

    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(getLandingButtons().continueGame).toBeDisabled()
    expect(screen.queryByText('Geodes')).not.toBeInTheDocument()
  })

  it('keeps Continue Game disabled when stored data is malformed', () => {
    storage.setItem(SAVED_GAME_KEY, '{not valid json')

    renderApp(storage)

    expect(getLandingButtons().continueGame).toBeDisabled()
  })

  it('starts a fresh game from New Game, which creates a save', () => {
    expect(savedGameExists(storage)).toBe(false)
    renderApp(storage)

    fireEvent.click(getLandingButtons().newGame)

    expect(
      screen.getByRole('textbox', { name: /guess the country/i }),
    ).toBeInTheDocument()
    expect(savedGameExists(storage)).toBe(true)
  })

  it('enables Continue Game after a game has been saved', () => {
    renderApp(storage)
    fireEvent.click(getLandingButtons().newGame)
    fireEvent.click(screen.getByRole('button', { name: /^home$/i }))

    expect(getLandingButtons().continueGame).toBeEnabled()
  })

  it('continues a saved game with its geode balance restored', () => {
    seedSavedGame(1150)
    renderApp(storage)

    fireEvent.click(screen.getByRole('button', { name: /continue game/i }))

    expect(
      screen.getByRole('textbox', { name: /guess the country/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('1150')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('asks for confirmation when replacing an existing saved game', () => {
    seedSavedGame(1150)
    renderApp(storage)

    fireEvent.click(getLandingButtons().newGame)

    expect(screen.getByText(/saved game already exists/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(getLandingButtons().newGame).toBeInTheDocument()
    expect(getLandingButtons().continueGame).toBeEnabled()
    expect(loadResumableGame(COUNTRIES, storage)?.player.geodes).toBe(1150)
  })

  it('replaces the saved game with a fresh one after confirmation', () => {
    seedSavedGame(1150)
    renderApp(storage)

    fireEvent.click(getLandingButtons().newGame)
    fireEvent.click(
      screen.getByRole('button', { name: /^replace & start new game$/i }),
    )

    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(loadResumableGame(COUNTRIES, storage)?.player.geodes).toBe(1000)
  })

  it('navigates to Settings and back to Landing', () => {
    renderApp(storage)

    fireEvent.click(getLandingButtons().settings)

    expect(
      screen.getByRole('heading', { level: 1, name: /^settings$/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to landing/i }))

    expect(getLandingButtons().newGame).toBeInTheDocument()
  })
})
