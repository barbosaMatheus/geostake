const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'

function GameTitle() {
  return (
    <header>
      <h1>{appName}</h1>
    </header>
  )
}

export default GameTitle
