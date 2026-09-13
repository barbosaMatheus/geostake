import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

function renderApp() {
  render(<App />)
}

function getLandingButtons() {
  return {
    newGame: screen.getByRole('button', { name: /^new game$/i }),
    continueGame: screen.getByRole('button', { name: /continue game/i }),
    settings: screen.getByRole('button', { name: /^settings$/i }),
  }
}

describe('App navigation', () => {
  it('shows the Landing screen as the initial view', () => {
    renderApp()

    const { newGame, continueGame, settings } = getLandingButtons()
    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(newGame).toBeInTheDocument()
    expect(continueGame).toBeInTheDocument()
    expect(settings).toBeInTheDocument()
    expect(screen.queryByText('Geodes')).not.toBeInTheDocument()
  })

  it('keeps Continue Game disabled because persistence is not implemented yet', () => {
    renderApp()

    expect(getLandingButtons().continueGame).toBeDisabled()
  })

  it('starts the game when New Game is clicked', () => {
    renderApp()

    fireEvent.click(getLandingButtons().newGame)

    expect(screen.queryByRole('button', { name: /^new game$/i })).toBeNull()
    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Geodes')).toBeInTheDocument()
    expect(screen.getByText('Lives')).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: /guess the country/i }),
    ).toBeInTheDocument()
  })

  it('navigates to the Settings screen and back to Landing', () => {
    renderApp()

    fireEvent.click(getLandingButtons().settings)

    expect(
      screen.getByRole('heading', { level: 1, name: /^settings$/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/settings.*will be added in a future update/i),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to landing/i }))

    expect(
      screen.getByRole('button', { name: /^new game$/i }),
    ).toBeInTheDocument()
  })

  it('returns to Landing from the Game view', () => {
    renderApp()

    fireEvent.click(getLandingButtons().newGame)
    expect(screen.getByText('Geodes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /back to landing/i }))

    expect(getLandingButtons().newGame).toBeInTheDocument()
    expect(screen.queryByText('Geodes')).not.toBeInTheDocument()
  })
})
