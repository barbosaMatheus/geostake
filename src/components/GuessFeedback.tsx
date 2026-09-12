import type { GuessResult } from '../types/guess'

interface GuessFeedbackProps {
  guessResult: GuessResult | null
  onNextTurn: () => void
}

function GuessFeedback({ guessResult, onNextTurn }: GuessFeedbackProps) {
  return (
    <section
      className="guess-feedback"
      aria-label="Guess feedback"
      aria-live="polite"
    >
      {guessResult === null ? (
        <p className="guess-feedback-hint">
          Submit a guess to see the result here.
        </p>
      ) : guessResult.outcome === 'correct' ? (
        <p className="guess-feedback-correct">
          That&apos;s right - the mystery country was {guessResult.country.name}
          . Nice work!
        </p>
      ) : (
        <p className="guess-feedback-incorrect">
          Not quite - {guessResult.guessedName} is not the mystery country. You
          have {guessResult.livesRemaining}{' '}
          {guessResult.livesRemaining === 1 ? 'life' : 'lives'} left.
        </p>
      )}
      {guessResult !== null && (
        <button
          className="button-primary next-turn-button"
          type="button"
          onClick={onNextTurn}
        >
          Start Next Turn
        </button>
      )}
    </section>
  )
}

export default GuessFeedback
