import type { Country } from '../types/country'
import { isoCodeOf } from '../data/countries/isoCode'
import { getFlagComponent } from '../visual/flagAtlas'

/**
 * Renders the mystery country's flag via the bundled country-flag-icons React
 * components. The accessible name is deliberately generic so the country's
 * identity is never revealed through text, alt, or aria labels (the flag image
 * itself is the clue). The `title` prop is intentionally never set.
 */
function CountryFlag({ country }: { country: Country }) {
  const iso = isoCodeOf(country)
  const Flag = getFlagComponent(iso)
  if (Flag === null) {
    return null
  }
  return (
    <span className="country-flag">
      <Flag
        className="country-flag-svg"
        role="img"
        aria-label="Country flag clue"
      />
    </span>
  )
}

export default CountryFlag
