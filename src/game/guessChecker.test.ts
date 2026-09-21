import { describe, expect, it } from 'vitest'
import {
  GuessChecker,
  countryNameVariants,
  damerauLevenshteinDistance,
  isExcludedGuessPair,
  jaroSimilarity,
  jaroWinklerSimilarity,
  normalizeGuess,
} from './guessChecker'
import {
  GUESS_CHECKER_CONFIG,
  USER_GUESS_EXCLUDED_PAIRS,
  USER_GUESS_MAX_EDIT_DISTANCE,
  USER_GUESS_MIN_PCT_MATCH,
} from './guessConfig'

describe('normalizeGuess', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(normalizeGuess('  BRAZIL  ')).toBe('brazil')
  })

  it('replaces ampersands with the word "and"', () => {
    expect(normalizeGuess('St Kitts & Nevis')).toBe('saint kitts and nevis')
    expect(normalizeGuess('Trinidad & Tobago')).toBe('trinidad and tobago')
  })

  it('treats "Saint" and "St" as equivalent', () => {
    expect(normalizeGuess('St Kitts & Nevis')).toBe(
      normalizeGuess('Saint Kitts and Nevis'),
    )
    expect(normalizeGuess('St. Lucia')).toBe('saint lucia')
  })

  it('treats "The" as an optional word', () => {
    expect(normalizeGuess('The Bahamas')).toBe('bahamas')
  })

  it('treats "of" as an optional word', () => {
    expect(normalizeGuess('United States of America')).toBe(
      'united states america',
    )
    expect(normalizeGuess('Republic of the Congo')).toBe('republic congo')
  })

  it('replaces punctuation with a single space', () => {
    expect(normalizeGuess('Timor-Leste')).toBe('timor leste')
    expect(normalizeGuess('Côte d\u2019Ivoire')).toBe('cote d ivoire')
    expect(normalizeGuess('St. Kitts & Nevis')).toBe('saint kitts and nevis')
    expect(normalizeGuess('Falkland Islands (Islas Malvinas)')).toBe(
      'falkland islands islas malvinas',
    )
  })

  it('collapses repeated whitespace', () => {
    expect(normalizeGuess('  republic    of   the   congo ')).toBe(
      'republic congo',
    )
  })

  it('normalizes accented characters to their unaccented equivalents', () => {
    expect(normalizeGuess('São Tomé and Príncipe')).toBe(
      'sao tome and principe',
    )
    expect(normalizeGuess('Brasília')).toBe('brasilia')
    expect(normalizeGuess('Côte d\u2019Ivoire')).toBe('cote d ivoire')
  })
})

describe('countryNameVariants', () => {
  it('produces the full name, base name, and each parenthetical alternative', () => {
    const variants = countryNameVariants('Falkland Islands (Islas Malvinas)')

    expect(variants).toContain('falkland islands islas malvinas')
    expect(variants).toContain('falkland islands')
    expect(variants).toContain('islas malvinas')
  })

  it('returns a single variant for names without parentheses', () => {
    expect(countryNameVariants('Romania')).toEqual(['romania'])
  })

  it('handles multiple parenthetical alternatives', () => {
    const variants = countryNameVariants('Country (Alpha) (Beta)')

    expect(variants).toContain('country')
    expect(variants).toContain('alpha')
    expect(variants).toContain('beta')
  })

  it('never yields an empty variant', () => {
    expect(countryNameVariants('(Islas Malvinas)')).toEqual(['islas malvinas'])
  })
})

describe('jaroSimilarity / jaroWinklerSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroSimilarity('romania', 'romania')).toBe(1)
    expect(jaroWinklerSimilarity('romania', 'romania')).toBe(1)
  })

  it('returns 0 when either string is empty', () => {
    expect(jaroSimilarity('', 'romania')).toBe(0)
    expect(jaroSimilarity('romania', '')).toBe(0)
    expect(jaroWinklerSimilarity('', 'romania')).toBe(0)
  })

  it('is typo tolerant enough to accept a one-letter typo', () => {
    expect(jaroWinklerSimilarity('romenia', 'romania')).toBeGreaterThanOrEqual(
      USER_GUESS_MIN_PCT_MATCH,
    )
  })

  it('scores clearly different names well below the default threshold', () => {
    expect(jaroWinklerSimilarity('atlantis', 'brazil')).toBeLessThan(
      USER_GUESS_MIN_PCT_MATCH,
    )
  })
})

describe('damerauLevenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(damerauLevenshteinDistance('romania', 'romania')).toBe(0)
  })

  it('counts a one-character substitution as a single edit', () => {
    expect(damerauLevenshteinDistance('romenia', 'romania')).toBe(1)
    expect(damerauLevenshteinDistance('brasil', 'brazil')).toBe(1)
  })

  it('counts an adjacent transposition as a single edit', () => {
    expect(damerauLevenshteinDistance('japna', 'japan')).toBe(1)
  })

  it('counts insertions and deletions as single edits', () => {
    expect(damerauLevenshteinDistance('niger', 'nigeria')).toBe(2)
  })

  it('counts multiple unrelated edits', () => {
    expect(damerauLevenshteinDistance('atlantis', 'brazil')).toBe(6)
  })
})

describe('isExcludedGuessPair', () => {
  const excludedPairs: Array<[string, string]> = [
    ['Iran', 'Iraq'],
    ['Iraq', 'Iran'],
    ['Ireland', 'Iceland'],
    ['Iceland', 'Ireland'],
    ['Dominica', 'The Dominican'],
    ['The Dominican', 'Dominica'],
    ['The Gambia', 'Zambia'],
    ['Zambia', 'The Gambia'],
  ]

  it.each(excludedPairs)('treats %s and %s as a banned pair', (a, b) => {
    expect(isExcludedGuessPair(normalizeGuess(a), normalizeGuess(b))).toBe(true)
  })

  it('treats each stored pair as canonical regardless of argument order', () => {
    for (const key of USER_GUESS_EXCLUDED_PAIRS) {
      const separatorIndex = key.lastIndexOf('|')
      const a = key.slice(0, separatorIndex)
      const b = key.slice(separatorIndex + 1)
      expect(isExcludedGuessPair(a, b)).toBe(true)
      expect(isExcludedGuessPair(b, a)).toBe(true)
    }
  })

  it('never excludes a name from itself', () => {
    expect(isExcludedGuessPair('iran', 'iran')).toBe(false)
    expect(isExcludedGuessPair('romania', 'romania')).toBe(false)
  })

  it('leaves non-banned pairs alone', () => {
    expect(isExcludedGuessPair('romenia', 'romania')).toBe(false)
    expect(isExcludedGuessPair('brasil', 'brazil')).toBe(false)
  })
})

describe('GuessChecker', () => {
  const checker = new GuessChecker()

  it('accepts an exact match', () => {
    expect(checker.isCorrect('Romania', 'Romania')).toBe(true)
  })

  it('accepts guesses regardless of case', () => {
    expect(checker.isCorrect('ROMANIA', 'Romania')).toBe(true)
    expect(checker.isCorrect('romania', 'ROMANIA')).toBe(true)
  })

  it('accepts an ampersand in place of "and"', () => {
    expect(checker.isCorrect('St Kitts & Nevis', 'Saint Kitts and Nevis')).toBe(
      true,
    )
    expect(
      checker.isCorrect('Saint Kitts & Nevis', 'Saint Kitts and Nevis'),
    ).toBe(true)
  })

  it('accepts "St" in place of "Saint"', () => {
    expect(checker.isCorrect('St Lucia', 'Saint Lucia')).toBe(true)
    expect(
      checker.isCorrect('St. Kitts and Nevis', 'Saint Kitts and Nevis'),
    ).toBe(true)
  })

  it('accepts "The" as optional', () => {
    expect(checker.isCorrect('Bahamas', 'The Bahamas')).toBe(true)
    expect(checker.isCorrect('The Bahamas', 'Bahamas')).toBe(true)
  })

  it('accepts "of" as optional', () => {
    expect(checker.isCorrect('Republic Congo', 'Republic of the Congo')).toBe(
      true,
    )
    expect(
      checker.isCorrect('Republic of Congo', 'Republic of the Congo'),
    ).toBe(true)
  })

  it('accepts each parenthetical alternative', () => {
    const countryName = 'Falkland Islands (Islas Malvinas)'

    expect(checker.isCorrect('Falkland Islands', countryName)).toBe(true)
    expect(checker.isCorrect('Islas Malvinas', countryName)).toBe(true)
    expect(
      checker.isCorrect('Falkland Islands (Islas Malvinas)', countryName),
    ).toBe(true)
    expect(
      checker.isCorrect('falkland islands islas malvinas', countryName),
    ).toBe(true)
  })

  it('normalizes punctuation and whitespace before comparing', () => {
    expect(checker.isCorrect('timor leste', 'Timor-Leste')).toBe(true)
    expect(checker.isCorrect('Timor-Leste', 'Timor-Leste')).toBe(true)
    expect(checker.isCorrect('  romania ', 'Romania')).toBe(true)
  })

  it('normalizes accented characters before comparing', () => {
    expect(
      checker.isCorrect('Sao Tome and Principe', 'São Tomé and Príncipe'),
    ).toBe(true)
    expect(checker.isCorrect('Brasilia', 'Brasília')).toBe(true)
    expect(checker.isCorrect('Cote d\u2019Ivoire', 'Côte d\u2019Ivoire')).toBe(
      true,
    )
  })

  it('accepts minor typos such as "Romenia" for "Romania"', () => {
    expect(checker.isCorrect('Romenia', 'Romania')).toBe(true)
  })

  it('accepts an adjacent transposition such as "Japna" for "Japan"', () => {
    expect(checker.isCorrect('Japna', 'Japan')).toBe(true)
  })

  it('accepts common spelling variants such as "Brasil" for "Brazil"', () => {
    expect(checker.isCorrect('Brasil', 'Brazil')).toBe(true)
  })

  it('rejects clearly incorrect guesses', () => {
    expect(checker.isCorrect('Atlantis', 'Brazil')).toBe(false)
    expect(checker.isCorrect('Canada', 'Brazil')).toBe(false)
    expect(checker.isCorrect('', 'Brazil')).toBe(false)
    expect(checker.isCorrect('   ', 'Brazil')).toBe(false)
  })

  it('rejects guesses that are merely similar but different countries', () => {
    expect(checker.isCorrect('Panama', 'Canada')).toBe(false)
    expect(checker.isCorrect('Chad', 'Chile')).toBe(false)
    expect(checker.isCorrect('Paraguay', 'Uruguay')).toBe(false)
  })

  it('rejects confusable country pairs that need more than one edit', () => {
    expect(checker.isCorrect('Nigeria', 'Niger')).toBe(false)
    expect(checker.isCorrect('Niger', 'Nigeria')).toBe(false)
    expect(checker.isCorrect('Australia', 'Austria')).toBe(false)
    expect(checker.isCorrect('Austria', 'Australia')).toBe(false)
    expect(checker.isCorrect('Slovakia', 'Slovenia')).toBe(false)
    expect(checker.isCorrect('Slovenia', 'Slovakia')).toBe(false)
    expect(checker.isCorrect('Malawi', 'Mali')).toBe(false)
    expect(checker.isCorrect('Mali', 'Malawi')).toBe(false)
    expect(checker.isCorrect('Mali', 'Malawai')).toBe(false)
  })

  it('rejects single-edit confusable country pairs via hard-coded exclusions', () => {
    expect(checker.isCorrect('Iran', 'Iraq')).toBe(false)
    expect(checker.isCorrect('Iraq', 'Iran')).toBe(false)
    expect(checker.isCorrect('Ireland', 'Iceland')).toBe(false)
    expect(checker.isCorrect('Iceland', 'Ireland')).toBe(false)
    expect(checker.isCorrect('Dominica', 'The Dominican')).toBe(false)
    expect(checker.isCorrect('The Dominican', 'Dominica')).toBe(false)
    expect(checker.isCorrect('The Gambia', 'Zambia')).toBe(false)
    expect(checker.isCorrect('Zambia', 'The Gambia')).toBe(false)
  })

  it('keeps single-edit confusables rejected even when the similarity gate is removed', () => {
    const noSimilarityGate = new GuessChecker({ minPercentMatch: 0 })

    expect(noSimilarityGate.isCorrect('Iran', 'Iraq')).toBe(false)
    expect(noSimilarityGate.isCorrect('Ireland', 'Iceland')).toBe(false)
  })

  it('keeps single-edit confusables rejected even when the edit cap is relaxed', () => {
    const allowsTwoEdits = new GuessChecker({ maxEditDistance: 2 })

    expect(allowsTwoEdits.isCorrect('Iran', 'Iraq')).toBe(false)
    expect(allowsTwoEdits.isCorrect('Ireland', 'Iceland')).toBe(false)
  })

  it('matches when any country-name variant meets the threshold', () => {
    expect(
      checker.isCorrect('Islas Malvinas', 'Falkland Islands (Islas Malvinas)'),
    ).toBe(true)
  })

  it('does not conflate parenthetical alternatives into a false positive', () => {
    expect(checker.isCorrect('Falkland Islands', 'Islas Malvinas')).toBe(false)
  })

  describe('with a configurable threshold', () => {
    it('defaults to USER_GUESS_MIN_PCT_MATCH and USER_GUESS_MAX_EDIT_DISTANCE', () => {
      expect(GUESS_CHECKER_CONFIG.minPercentMatch).toBe(
        USER_GUESS_MIN_PCT_MATCH,
      )
      expect(GUESS_CHECKER_CONFIG.maxEditDistance).toBe(
        USER_GUESS_MAX_EDIT_DISTANCE,
      )
      expect(USER_GUESS_MIN_PCT_MATCH).toBe(0.9)
      expect(USER_GUESS_MAX_EDIT_DISTANCE).toBe(1)
    })

    it('rejects near-misses when the percentile threshold is raised', () => {
      const strict = new GuessChecker({ minPercentMatch: 0.95 })

      expect(strict.isCorrect('Romenia', 'Romania')).toBe(false)
      expect(strict.isCorrect('Romania', 'Romania')).toBe(true)
    })

    it('still rejects multi-edit guesses when the percentile threshold is lowered', () => {
      const lenient = new GuessChecker({ minPercentMatch: 0 })

      expect(lenient.isCorrect('Romenia', 'Romania')).toBe(true)
      expect(lenient.isCorrect('Canada', 'Brazil')).toBe(false)
    })

    it('still rejects completely unrelated guesses at a zero threshold', () => {
      const lenient = new GuessChecker({ minPercentMatch: 0 })

      expect(lenient.isCorrect('', 'Brazil')).toBe(false)
    })

    it('admits single-edit typos only when the edit cap is relaxed', () => {
      const allowsTwoEdits = new GuessChecker({ maxEditDistance: 2 })

      expect(allowsTwoEdits.isCorrect('Nigeria', 'Niger')).toBe(true)
    })

    it('accepts only exact matches when the edit cap is zero', () => {
      const exactOnly = new GuessChecker({ maxEditDistance: 0 })

      expect(exactOnly.isCorrect('Romania', 'Romania')).toBe(true)
      expect(exactOnly.isCorrect('Romenia', 'Romania')).toBe(false)
    })
  })

  describe('matchPercent', () => {
    it('reports 100 for an exact normalized match', () => {
      expect(checker.matchPercent('Romania', 'Romania')).toBe(100)
      expect(checker.matchPercent('Brazil', 'Brazil')).toBe(100)
    })

    it('reports the rounded similarity for an accepted single-letter typo', () => {
      expect(checker.matchPercent('Brasil', 'Brazil')).toBe(92)
      expect(checker.matchPercent('Romenia', 'Romania')).toBe(93)
    })

    it('reports 100 when a guess matches a country-name variant exactly', () => {
      expect(
        checker.matchPercent(
          'Falkland Islands',
          'Falkland Islands (Islas Malvinas)',
        ),
      ).toBe(100)
    })

    it('returns null for an empty guess', () => {
      expect(checker.matchPercent('', 'Romania')).toBeNull()
    })

    it('returns null when the guess is not correct', () => {
      expect(checker.matchPercent('Atlantis', 'Romania')).toBeNull()
      expect(checker.matchPercent('Canada', 'Brazil')).toBeNull()
    })

    it('returns null for hard-coded excluded confusables', () => {
      expect(checker.matchPercent('Iran', 'Iraq')).toBeNull()
      expect(checker.matchPercent('Ireland', 'Iceland')).toBeNull()
    })

    it('reports a percentage when the gates are relaxed enough to accept', () => {
      const allowsTwoEdits = new GuessChecker({ maxEditDistance: 2 })

      expect(checker.matchPercent('Nigeria', 'Niger')).toBeNull()
      expect(allowsTwoEdits.matchPercent('Nigeria', 'Niger')).not.toBeNull()
    })
  })
})
