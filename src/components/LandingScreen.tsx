import { version } from '../../package.json'
import AppLogo from './AppLogo'

const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'

interface LandingScreenProps {
  hasSavedGame: boolean
  confirmingNewGame: boolean
  onNewGame: () => void
  onContinueGame: () => void
  onConfirmNewGame: () => void
  onCancelNewGame: () => void
  onSettings: () => void
}

function LandingScreen({
  hasSavedGame,
  confirmingNewGame,
  onNewGame,
  onContinueGame,
  onConfirmNewGame,
  onCancelNewGame,
  onSettings,
}: LandingScreenProps) {
  return (
    <div className="app landing-screen">
      <header className="app-header">
        <div className="app-header-row">
          <AppLogo />
          <h1>{appName}</h1>
        </div>
        <p className="tagline">
          {
            'Buy clues, spend geodes, and identify the mystery country before your lives run out.'
          }
        </p>
      </header>

      {confirmingNewGame ? (
        <section className="landing-confirm" aria-label="Confirm new game">
          <p className="landing-confirm-note">
            A saved game already exists. Starting a new game will replace it.
          </p>
          <div className="game-over-actions">
            <button
              className="button-danger"
              type="button"
              onClick={onConfirmNewGame}
            >
              Replace &amp; Start New Game
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={onCancelNewGame}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : (
        <nav className="landing-menu" aria-label="Main menu">
          <button className="button-primary" type="button" onClick={onNewGame}>
            New Game
          </button>
          <button
            className="button-secondary"
            type="button"
            disabled={!hasSavedGame}
            onClick={onContinueGame}
          >
            Continue Game
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={onSettings}
          >
            Settings
          </button>
        </nav>
      )}

      <footer className="landing-footer">
        <span>GeoStake v{version}</span>
      </footer>
    </div>
  )
}

export default LandingScreen
