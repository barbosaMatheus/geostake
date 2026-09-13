import type { Country } from '../types/country'
import { isoCodeOf } from '../data/countries/isoCode'
import { getOutlineGeometry } from '../visual/outlineAtlas'

/**
 * Renders the mystery country's silhouette/outline as an SVG path scaled to
 * fit its container. The accessible name is deliberately generic so the
 * country's identity is never revealed through text, alt, or aria labels.
 */
function CountryOutline({ country }: { country: Country }) {
  const geometry = getOutlineGeometry(isoCodeOf(country))
  if (geometry === null) {
    return null
  }
  return (
    <span className="country-outline">
      <svg
        className="country-outline-svg"
        viewBox={geometry.viewBox}
        role="img"
        aria-label="Country outline clue"
        preserveAspectRatio="xMidYMid meet"
      >
        <path className="country-outline-path" d={geometry.path} />
      </svg>
    </span>
  )
}

export default CountryOutline
