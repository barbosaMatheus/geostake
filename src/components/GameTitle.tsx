const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'
import AppLogo from './AppLogo'

function GameTitle() {
  return (
    <header className="app-header">
      <div className="app-header-row">
        <AppLogo />
        <h1>{appName}</h1>
      </div>
    </header>
  )
}

export default GameTitle
