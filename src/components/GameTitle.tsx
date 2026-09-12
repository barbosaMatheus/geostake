const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'

function GameTitle() {
  return (
    <header>
      <h1>{appName}</h1>
      <p className="tagline">
        {
          'Buy clues, spend geodes, and identify the mystery country before your lives run out.'
        }
      </p>
    </header>
  )
}

export default GameTitle
