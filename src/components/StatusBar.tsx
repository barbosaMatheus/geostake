import { canPurchaseLife } from '../game/economy'
import type { EconomyConfig } from '../game/economyConfig'
import type { PlayerState } from '../types/player'

interface StatusBarProps {
  player: PlayerState
  turn: number
  economy: EconomyConfig
  disabled?: boolean
  onHome?: () => void
  onBuyLife: () => void
  onSkip?: () => void
}

function StatusBar({
  player,
  turn,
  economy,
  disabled = false,
  onHome,
  onBuyLife,
  onSkip,
}: StatusBarProps) {
  const purchasable = canPurchaseLife(player, economy)
  const atMaxLives = player.lives >= economy.maxLives
  const purchaseDisabled = disabled || !purchasable

  return (
    <section className="status-bar" aria-label="Player status">
      <dl className="resource-list">
        <div className="status-column">
          <div className="resource">
            <dt className="resource-label">Geodes</dt>
            <dd className="resource-value">{player.geodes}</dd>
          </div>
          {onHome && (
            <button className="home-button" type="button" onClick={onHome}>
              Home
            </button>
          )}
        </div>
        <div className="status-column">
          <div className="resource">
            <dt className="resource-label">Lives</dt>
            <dd className="resource-value">{player.lives}</dd>
          </div>
          <button
            className="life-buy-button"
            type="button"
            disabled={purchaseDisabled}
            onClick={onBuyLife}
          >
            Buy Life · {economy.lifeCost} geodes
          </button>
          {!disabled && !purchasable && (
            <p className="life-purchase-note">
              {atMaxLives ? 'Lives are maxed out' : 'Not enough geodes'}
            </p>
          )}
        </div>
        <div className="status-column">
          <div className="resource">
            <dt className="resource-label">Turn</dt>
            <dd className="resource-value">{turn}</dd>
          </div>
          {onSkip && (
            <button className="skip-button" type="button" onClick={onSkip}>
              Skip
            </button>
          )}
        </div>
      </dl>
    </section>
  )
}

export default StatusBar
