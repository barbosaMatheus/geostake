const appName = import.meta.env.VITE_APP_NAME ?? 'GeoStake'
import AppLogo from './AppLogo'
import HelpButton from './HelpButton'

interface GameTitleProps {
  onHelp?: () => void
}

function GameTitle({ onHelp }: GameTitleProps) {
  return (
    <header className="app-header">
      <div className="app-header-row">
        <AppLogo />
        <h1>{appName}</h1>
        {onHelp && <HelpButton onClick={onHelp} />}
      </div>
    </header>
  )
}

export default GameTitle