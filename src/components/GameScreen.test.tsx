import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../game/config'
import { TEST_COUNTRIES } from '../tests/fixtures'
import GameScreen from './GameScreen'

const alwaysSelectFirst = () => 0

const manualContinueConfig = { ...GAME_CONFIG, continueOnCorrectGuess: false }

function getGuessControls() {
  return {
    guessInput: screen.getByRole('textbox', { name: /guess the country/i }),
    submitButton: screen.getByRole('button', { name: /submit guess/i }),
  }
}

describe('GameScreen', () => {
  it('renders the header, resources, mystery country, clue area, and guess controls', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

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
    expect(screen.getByRole('heading', { name: /clues/i })).toBeInTheDocument()
    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
  })

  it('starts a turn with exactly one randomly provided starting clue revealed', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

    expect(screen.getByText('Population')).toBeInTheDocument()
    expect(screen.getByText('221,359,387')).toBeInTheDocument()
    expect(screen.getAllByText('Starting clue')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Land Area · Free' }),
    ).toBeInTheDocument()
  })

  it('requires a non-empty guess before enabling the submit button', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    expect(submitButton).toBeDisabled()

    fireEvent.change(guessInput, { target: { value: '   ' } })
    expect(submitButton).toBeDisabled()

    fireEvent.change(guessInput, { target: { value: 'Brazil' } })
    expect(submitButton).toBeEnabled()
  })

  it('reveals a purchased clue and deducts its cost in geodes', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

    fireEvent.click(screen.getByRole('button', { name: 'Region · 50 geodes' }))

    expect(screen.getByText('South America')).toBeInTheDocument()
    expect(screen.getByText('950')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Region · 50 geodes',
      }),
    ).not.toBeInTheDocument()
  })

  it('automatically starts a new turn after a correct guess by default', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: TEST_COUNTRIES[0].name } })
    fireEvent.click(submitButton)

    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/was brazil/i)).not.toBeInTheDocument()
    expect(getGuessControls().guessInput).toBeEnabled()
    expect(screen.getAllByText('Starting clue')).toHaveLength(1)
    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('shows positive feedback and waits for the player when auto-advance is disabled', () => {
    render(
      <GameScreen
        countries={TEST_COUNTRIES}
        random={alwaysSelectFirst}
        config={manualContinueConfig}
      />,
    )
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: TEST_COUNTRIES[0].name } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/was brazil/i)).toBeInTheDocument()
    expect(screen.getByText(TEST_COUNTRIES[0].name)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /start next turn/i }),
    ).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('disables clue purchases while a solved turn waits for the next round', () => {
    render(
      <GameScreen
        countries={TEST_COUNTRIES}
        random={alwaysSelectFirst}
        config={manualContinueConfig}
      />,
    )
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.click(screen.getByRole('button', { name: 'Region · 50 geodes' }))
    expect(screen.getByText('South America')).toBeInTheDocument()
    expect(screen.getByText('950')).toBeInTheDocument()

    fireEvent.change(guessInput, { target: { value: TEST_COUNTRIES[0].name } })
    fireEvent.click(submitButton)

    expect(
      screen.getByRole('button', { name: /start next turn/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('South America')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Land Area · Free' }),
    ).toBeDisabled()
    expect(
      screen.getByText(/clue purchases are disabled until the next turn/i),
    ).toBeInTheDocument()
  })

  it('shows negative feedback and reduces lives on an incorrect guess', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: 'Atlantis' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('starts a new turn after a guess and clears the feedback', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
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

  it('resets the clue state when starting a new turn', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.click(screen.getByRole('button', { name: 'Region · 50 geodes' }))
    expect(screen.getByText('South America')).toBeInTheDocument()
    expect(screen.getByText('950')).toBeInTheDocument()

    fireEvent.change(guessInput, { target: { value: 'Atlantis' } })
    fireEvent.click(submitButton)
    fireEvent.click(screen.getByRole('button', { name: /start next turn/i }))

    expect(screen.queryByText('South America')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Region · 50 geodes' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Starting clue')).toHaveLength(1)
    expect(screen.getByText('950')).toBeInTheDocument()
  })
})
