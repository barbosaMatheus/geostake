import { useState, type FormEvent } from 'react'

interface GuessFormProps {
  disabled: boolean
  onSubmit: (guess: string) => void
}

function GuessForm({ disabled, onSubmit }: GuessFormProps) {
  const [guess, setGuess] = useState('')
  const trimmedGuess = guess.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (trimmedGuess === '') {
      return
    }
    onSubmit(trimmedGuess)
    setGuess('')
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <label htmlFor="country-guess-input">Guess the country</label>
      <div className="guess-form-row">
        <input
          id="country-guess-input"
          className="guess-input"
          type="text"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          disabled={disabled}
          placeholder="Type the country name"
          autoComplete="off"
        />
        <button
          className="button-primary"
          type="submit"
          disabled={disabled || trimmedGuess === ''}
        >
          Submit Guess
        </button>
      </div>
    </form>
  )
}

export default GuessForm
