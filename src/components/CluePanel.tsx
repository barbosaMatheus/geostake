import {
  CLUE_COST_MULTIPLIER,
  CLUES,
  getCluesForTier,
  getClueTiers,
  getTierLabel,
} from '../game/clueConfig'
import { formatClueValue, getClueCost, isClueAvailable } from '../game/clues'
import type { ClueDefinition, ClueId, ClueTier, ClueValue } from '../types/clue'
import type { Country } from '../types/country'
import type { GeodeAmount } from '../types/player'

interface CluePanelProps {
  country: Country
  geodes: GeodeAmount
  startingClueId: ClueId
  revealedClueIds: readonly ClueId[]
  onReveal: (clueId: ClueId) => void
}

function CluePanel({
  country,
  geodes,
  startingClueId,
  revealedClueIds,
  onReveal,
}: CluePanelProps) {
  const tiers = getClueTiers(CLUES)

  return (
    <section className="section-card clue-panel" aria-label="Clues">
      <h2 className="section-title">Clues</h2>
      {tiers.map((tier) => (
        <ClueTierBlock
          key={tier}
          tier={tier}
          country={country}
          geodes={geodes}
          startingClueId={startingClueId}
          revealedClueIds={revealedClueIds}
          onReveal={onReveal}
        />
      ))}
    </section>
  )
}

interface ClueRowProps {
  clue: ClueDefinition<ClueValue>
  country: Country
  geodes: GeodeAmount
  startingClueId: ClueId
  revealedClueIds: readonly ClueId[]
  onReveal: (clueId: ClueId) => void
}

function ClueTierBlock({
  tier,
  country,
  geodes,
  startingClueId,
  revealedClueIds,
  onReveal,
}: Omit<ClueRowProps, 'clue'> & { tier: ClueTier }) {
  const clues = getCluesForTier(tier, CLUES)

  return (
    <div className="clue-tier">
      <h3 className="clue-tier-title">{getTierLabel(tier)}</h3>
      <ul className="clue-list">
        {clues.map((clue) => (
          <ClueRow
            key={clue.id}
            clue={clue}
            country={country}
            geodes={geodes}
            startingClueId={startingClueId}
            revealedClueIds={revealedClueIds}
            onReveal={onReveal}
          />
        ))}
      </ul>
    </div>
  )
}

function ClueRow({
  clue,
  country,
  geodes,
  startingClueId,
  revealedClueIds,
  onReveal,
}: ClueRowProps) {
  const isStartingClue = clue.id === startingClueId
  const isRevealed = revealedClueIds.includes(clue.id)

  if (isRevealed) {
    const className = [
      'clue',
      'clue-revealed',
      isStartingClue ? 'clue-starting' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <li className={className}>
        <span className="clue-name">{clue.label}</span>
        <span className="clue-value">{formatClueValue(clue.id, country)}</span>
        {isStartingClue && <span className="clue-badge">Starting clue</span>}
      </li>
    )
  }

  const available = isClueAvailable(clue.id, country)
  const cost = getClueCost(clue.id, CLUE_COST_MULTIPLIER)
  const affordable = geodes >= cost

  if (!available) {
    return (
      <li className="clue clue-unavailable">
        <span className="clue-name">{clue.label}</span>
        <span className="clue-unavailable-message">
          Unavailable for this country
        </span>
      </li>
    )
  }

  const className = [
    'clue',
    'clue-purchasable',
    affordable ? '' : 'clue-unaffordable',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className}>
      <button
        className="clue-buy-button"
        type="button"
        disabled={!affordable}
        onClick={() => onReveal(clue.id)}
      >
        {clue.label} · {cost === 0 ? 'Free' : `${cost} geodes`}
      </button>
      {!affordable && (
        <span className="clue-unaffordable-message">Not enough geodes</span>
      )}
    </li>
  )
}

export default CluePanel
