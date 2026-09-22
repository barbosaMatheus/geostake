import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import TutorialScreen from './TutorialScreen'

const alwaysSelectFirst = () => 0

function getGuessControls() {
  return {
    guessInput: screen.getByRole('textbox', { name: /guess the country/i }),
    submitButton: screen.getByRole('button', { name: /submit guess/i }),
  }
}

describe('TutorialScreen', () => {
  it('renders the tutorial shell with the normal starting resources', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mystery country/i })).toBeInTheDocument()
    expect(screen.getByText('?????')).toBeInTheDocument()
    expect(screen.getByText('Geodes')).toBeInTheDocument()
    expect(screen.getByText('Lives')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Turn')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /clues/i })).toBeInTheDocument()
    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
  })

  it('does not offer the debug Skip control in the tutorial', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

    expect(screen.queryByRole('button', { name: /^skip$/i })).not.toBeInTheDocument()
  })

  it('opens the tutorial with Brazil as the mystery country', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: 'Brazil' } })
    fireEvent.click(submitButton)

    expect(
      screen.getByText(/match with 'Brazil'/),
    ).toBeInTheDocument()
    expect(screen.getByText('Brazil')).toBeInTheDocument()
  })

  it('rewards a correct tutorial guess like the regular game', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: TEST_COUNTRIES[0].name } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/earned 500 geodes/i)).toBeInTheDocument()
    expect(screen.getByText('1500')).toBeInTheDocument()
  })

  it('deducts a life on an incorrect guess and keeps the turn open', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.change(guessInput, { target: { value: 'Atlantis' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(guessInput).toBeEnabled()
  })

  it('resets the tutorial to its starting state when Start Next Turn is pressed', () => {
    render(<TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)
    const { guessInput, submitButton } = getGuessControls()

    fireEvent.click(screen.getByRole('button', { name: 'Region · 50 geodes' }))
    expect(screen.getByText('South America')).toBeInTheDocument()
    expect(screen.getByText('950')).toBeInTheDocument()

    fireEvent.change(guessInput, { target: { value: TEST_COUNTRIES[0].name } })
    fireEvent.click(submitButton)
    expect(screen.getByText(/earned 490 geodes/i)).toBeInTheDocument()
    expect(screen.getByText('1440')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start next turn/i }))

    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(
      screen.getByText(/submit a guess to see the result/i),
    ).toBeInTheDocument()
    expect(getGuessControls().guessInput).toBeEnabled()
  })

  it('offers a Home control that exits the tutorial when provided', () => {
    const onExit = vi.fn()
    render(
      <TutorialScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} onExit={onExit} />,
    )

    const homeButton = screen.getByRole('button', { name: /^home$/i })
    fireEvent.click(homeButton)

    expect(onExit).toHaveBeenCalledTimes(1)
  })
})