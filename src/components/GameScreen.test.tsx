import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MOCK_COUNTRIES } from '../data/mockCountries'
import GameScreen from './GameScreen'

const alwaysSelectFirst = () => 0

function getGuessControls() {
  return {
    guessInput: screen.getByRole('textbox', { name: /guess the country/i }),
    submitButton: screen.getByRole('button', { name: /submit guess/i }),
  }
}

describe('GameScreen', () => {
  it('renders the header, resources, mystery country, and guess controls', () => {
    render(<GameScreen countries={MOCK_COUNTRIES} random={alwaysSelectFirst} />)

    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Geodes')).toBeInTheDocument()
    expect(screen.getByText('Lives')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /mystery country/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(MOCK_COUNTRIES[0].startingClue)).toBeInTheDocument()
    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
  })

  it('requires a non-empty guess before enabling the submit button', () => {
    render(<GameScreen countries={MOCK_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    expect(submitButton).toBeDisabled()

    fireEvent.change(guessInput, { target: { value: '   ' } })
    expect(submitButton).toBeDisabled()

    fireEvent.change(guessInput, { target: { value: 'Brazil' } })
    expect(submitButton).toBeEnabled()
  })

  it('shows positive feedback and reveals the country on a correct guess', () => {
    render(<GameScreen countries={MOCK_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: MOCK_COUNTRIES[0].name } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/was brazil/i)).toBeInTheDocument()
    expect(screen.getByText(MOCK_COUNTRIES[0].name)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /start next turn/i }),
    ).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('shows negative feedback and reduces lives on an incorrect guess', () => {
    render(<GameScreen countries={MOCK_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: 'Atlantis' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('starts a new turn after a guess and clears the feedback', () => {
    render(<GameScreen countries={MOCK_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: 'Atlantis' } })
    fireEvent.click(submitButton)
    fireEvent.click(screen.getByRole('button', { name: /start next turn/i }))

    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/not quite/i)).not.toBeInTheDocument()
    expect(getGuessControls().guessInput).toBeEnabled()
  })
})
