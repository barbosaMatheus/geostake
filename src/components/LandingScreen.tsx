const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'

interface LandingScreenProps {
  onNewGame: () => void
  onSettings: () => void
}

function LandingScreen({ onNewGame, onSettings }: LandingScreenProps) {
  return (
    <div className="app landing-screen">
      <header>
        <h1>{appName}</h1>
        <p className="tagline">
          {
            'Buy clues, spend geodes, and identify the mystery country before your lives run out.'
          }
        </p>
      </header>

      <nav className="landing-menu" aria-label="Main menu">
        <button className="button-primary" type="button" onClick={onNewGame}>
          New Game
        </button>
        <button className="button-secondary" type="button" disabled>
          Continue Game
        </button>
        <button className="button-secondary" type="button" onClick={onSettings}>
          Settings
        </button>
      </nav>
    </div>
  )
}

export default LandingScreen
