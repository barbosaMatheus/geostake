import type { Country } from '../types/country'

interface MysteryCountryProps {
  country: Country
  revealed: boolean
}

function MysteryCountry({ country, revealed }: MysteryCountryProps) {
  return (
    <section
      className="section-card mystery-country"
      aria-label="Mystery country"
    >
      <h2 className="section-title">Mystery Country</h2>
      <p className="mystery-country-name" aria-live="polite">
        {revealed ? country.name : '?????'}
      </p>
      <p className="clue">{country.startingClue}</p>
    </section>
  )
}

export default MysteryCountry
