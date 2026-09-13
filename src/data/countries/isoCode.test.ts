import { describe, expect, it } from 'vitest'
import { isoCodeOf } from './isoCode'
import type { Country } from '../../types/country'

function country(
  id: string,
  internetCountryCode?: string,
): Pick<Country, 'id' | 'internetCountryCode'> {
  return { id, internetCountryCode }
}

describe('isoCodeOf', () => {
  it('derives the uppercase ISO code from a country internet country code', () => {
    expect(isoCodeOf(country('br', '.br'))).toBe('BR')
    expect(isoCodeOf(country('jp', '.jp'))).toBe('JP')
    expect(isoCodeOf(country('us', '.us'))).toBe('US')
    expect(isoCodeOf(country('de', '.de'))).toBe('DE')
  })

  it('overrides the United Kingdom internet code to GB', () => {
    expect(isoCodeOf(country('uk', '.uk'))).toBe('GB')
  })

  it('overrides France to FR despite its multi-code internet field', () => {
    expect(
      isoCodeOf(
        country(
          'fr',
          'metropolitan France - .fr; French Guiana - .gf; Guadeloupe - .gp',
        ),
      ),
    ).toBe('FR')
  })

  it('returns null when no internet country code exists', () => {
    expect(isoCodeOf(country('br'))).toBeNull()
    expect(isoCodeOf(country('xy', 'not a code'))).toBeNull()
  })
})
