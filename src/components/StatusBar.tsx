import type { PlayerState } from '../types/player'

interface StatusBarProps {
  player: PlayerState
}

function StatusBar({ player }: StatusBarProps) {
  return (
    <dl className="status-bar" aria-label="Player resources">
      <div className="resource">
        <dt className="resource-label">Geodes</dt>
        <dd className="resource-value">{player.geodes}</dd>
      </div>
      <div className="resource">
        <dt className="resource-label">Lives</dt>
        <dd className="resource-value">{player.lives}</dd>
      </div>
    </dl>
  )
}

export default StatusBar
