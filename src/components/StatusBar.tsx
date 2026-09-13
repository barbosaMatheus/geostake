import { canPurchaseLife } from '../game/economy'
import type { EconomyConfig } from '../game/economyConfig'
import type { PlayerState } from '../types/player'

interface StatusBarProps {
  player: PlayerState
  turn: number
  economy: EconomyConfig
  disabled?: boolean
  onBuyLife: () => void
}

function StatusBar({
  player,
  turn,
  economy,
  disabled = false,
  onBuyLife,
}: StatusBarProps) {
  const purchasable = canPurchaseLife(player, economy)
  const atMaxLives = player.lives >= economy.maxLives
  const purchaseDisabled = disabled || !purchasable

  return (
    <section className="status-bar" aria-label="Player resources">
      <dl className="resource-list">
        <div className="resource">
          <dt className="resource-label">Geodes</dt>
          <dd className="resource-value">{player.geodes}</dd>
        </div>
        <div className="resource">
          <dt className="resource-label">Lives</dt>
          <dd className="resource-value">{player.lives}</dd>
        </div>
        <div className="resource">
          <dt className="resource-label">Turn</dt>
          <dd className="resource-value">{turn}</dd>
        </div>
      </dl>
      <div className="life-purchase">
        <button
          className="life-buy-button"
          type="button"
          disabled={purchaseDisabled}
          onClick={onBuyLife}
        >
          Buy Life · {economy.lifeCost} geodes
        </button>
        {!disabled && !purchasable && atMaxLives && (
          <p className="life-purchase-note">Lives are maxed out</p>
        )}
        {!disabled && !purchasable && !atMaxLives && (
          <p className="life-purchase-note">Not enough geodes</p>
        )}
      </div>
    </section>
  )
}

export default StatusBar
