import type { GuessResult, LastIncorrectGuess } from '../types/guess'

interface GuessFeedbackProps {
  guessResult: GuessResult | null
  lastIncorrectGuess: LastIncorrectGuess | null
  lives: number
  onNextTurn: () => void
}

function GuessFeedback({
  guessResult,
  lastIncorrectGuess,
  lives,
  onNextTurn,
}: GuessFeedbackProps) {
  if (lives === 0) {
    return (
      <section
        className="guess-feedback"
        aria-label="Guess feedback"
        aria-live="polite"
      >
        <p className="guess-feedback-game-over">
          Game over - you&apos;re out of lives. Start a new game to play again.
        </p>
        <button
          className="button-primary next-turn-button"
          type="button"
          onClick={onNextTurn}
        >
          Start New Game
        </button>
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
          That&apos;s right - the mystery country was {guessResult.country.name}
          . Nice work!
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
