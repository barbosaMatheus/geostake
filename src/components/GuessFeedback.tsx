import { useState } from 'react'
import type { GuessResult, LastIncorrectGuess } from '../types/guess'

interface GuessFeedbackProps {
  guessResult: GuessResult | null
  lastIncorrectGuess: LastIncorrectGuess | null
  lives: number
  countryName: string
  matchPercent: number | null
  onNextTurn: () => void
}

function GuessFeedback({
  guessResult,
  lastIncorrectGuess,
  lives,
  countryName,
  matchPercent,
  onNextTurn,
}: GuessFeedbackProps) {
  const [confirmingNewGame, setConfirmingNewGame] = useState(false)

  if (lives === 0) {
    return (
      <section
        className="guess-feedback"
        aria-label="Guess feedback"
        aria-live="polite"
      >
        <p className="guess-feedback-game-over">
          Out of lives. The mystery country was {countryName}.
        </p>
        {confirmingNewGame ? (
          <div className="game-over-confirm">
            <p className="game-over-confirm-note">
              This resets your geodes, lives, and turn to the start of the game.
            </p>
            <div className="game-over-actions">
              <button
                className="button-danger"
                type="button"
                onClick={onNextTurn}
              >
                Confirm New Game
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => setConfirmingNewGame(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="button-primary next-turn-button"
            type="button"
            onClick={() => setConfirmingNewGame(true)}
          >
            Start New Game
          </button>
        )}
      </section>
    )
  }

  if (guessResult?.outcome === 'correct') {
    return (
      <section
        className="guess-feedback"
        aria-label="Guess feedback"
        aria-live="polite"
      >
        <p className="guess-feedback-correct">
          {`Correct! ${matchPercent ?? 100}% match with '${guessResult.country.name}'. You earned ${guessResult.geodesAwarded} geodes!`}
        </p>
        <button
          className="button-primary next-turn-button"
          type="button"
          onClick={onNextTurn}
        >
          Start Next Turn
        </button>
      </section>
    )
  }

  if (lastIncorrectGuess !== null) {
    return (
      <section
        className="guess-feedback"
        aria-label="Guess feedback"
        aria-live="polite"
      >
        <p className="guess-feedback-incorrect">
          Not quite - {lastIncorrectGuess.guessedName} is not the mystery
          country. You have {lastIncorrectGuess.livesRemaining}{' '}
          {lastIncorrectGuess.livesRemaining === 1 ? 'life' : 'lives'} left.
        </p>
      </section>
    )
  }

  return (
    <section
      className="guess-feedback"
      aria-label="Guess feedback"
      aria-live="polite"
    >
      <p className="guess-feedback-hint">
        Submit a guess to see the result here.
      </p>
    </section>
  )
}

export default GuessFeedback
