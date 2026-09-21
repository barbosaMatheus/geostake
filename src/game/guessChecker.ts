import {
  GUESS_CHECKER_CONFIG,
  USER_GUESS_EXCLUDED_PAIRS,
  type GuessCheckerConfig,
} from './guessConfig'

const AMMERSAND_RE = /&/g
const PUNCTUATION_RE = /[.,\-'‘’():]/g
const SAINT_ABBREVIATION_RE = /\bst\b/g
const OPTIONAL_THE_RE = /\bthe\b/g
const OPTIONAL_OF_RE = /\bof\b/g
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g
const REPEATED_WHITESPACE_RE = /\s+/g
const PARENTHETICAL_RE = /\(([^)]+)\)/g

const MAX_PREFIX = 4
const PREFIX_BOOST = 0.1

/**
 * Normalizes a user guess or country name into a canonical string so that
 * unrelated variations (case, punctuation, accents, optional words) compare
 * equally before fuzzy matching is applied.
 */
export function normalizeGuess(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(AMMERSAND_RE, ' and ')
    .replace(PUNCTUATION_RE, ' ')
    .replace(SAINT_ABBREVIATION_RE, 'saint')
    .replace(OPTIONAL_THE_RE, ' ')
    .replace(OPTIONAL_OF_RE, ' ')
    .normalize('NFD')
    .replace(COMBINING_MARKS_RE, '')
    .replace(REPEATED_WHITESPACE_RE, ' ')
    .trim()
}

/**
 * Produces the normalized name variants for a country, treating each
 * parenthetical alternative as a separately acceptable name. For
 * `Falkland Islands (Islas Malvinas)` this yields the full name, the name
 * without the parenthesis, and the parenthetical content alone.
 */
export function countryNameVariants(name: string): string[] {
  const parentheticals = Array.from(
    name.matchAll(PARENTHETICAL_RE),
    (match) => match[1],
  )
  const nameWithoutParentheticals = name.replace(PARENTHETICAL_RE, ' ')
  const candidates = [name, nameWithoutParentheticals, ...parentheticals]
  const variants = new Set<string>()
  for (const candidate of candidates) {
    const normalized = normalizeGuess(candidate)
    if (normalized !== '') {
      variants.add(normalized)
    }
  }
  return Array.from(variants)
}

/**
 * Returns the Jaro similarity between two strings. See
 * https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
 */
export function jaroSimilarity(a: string, b: string): number {
  if (a === b) {
    return 1
  }
  if (a.length === 0 || b.length === 0) {
    return 0
  }
  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1
  const aMatched = new Array<boolean>(a.length).fill(false)
  const bMatched = new Array<boolean>(b.length).fill(false)
  let matchCount = 0
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, b.length)
    for (let j = start; j < end; j++) {
      if (bMatched[j] || a[i] !== b[j]) {
        continue
      }
      aMatched[i] = true
      bMatched[j] = true
      matchCount++
      break
    }
  }
  if (matchCount === 0) {
    return 0
  }
  let transpositions = 0
  let bIndex = 0
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) {
      continue
    }
    while (!bMatched[bIndex]) {
      bIndex++
    }
    if (a[i] !== b[bIndex]) {
      transpositions++
    }
    bIndex++
  }
  const m = matchCount
  return (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3
}

/**
 * Returns the Jaro-Winkler similarity between two strings, boosting matches
 * that share a common prefix so minor typos score higher than raw Jaro.
 */
export function jaroWinklerSimilarity(a: string, b: string): number {
  const jaro = jaroSimilarity(a, b)
  const limit = Math.min(a.length, b.length, MAX_PREFIX)
  let prefixLength = 0
  for (let i = 0; i < limit; i++) {
    if (a[i] === b[i]) {
      prefixLength++
    } else {
      break
    }
  }
  return jaro + prefixLength * PREFIX_BOOST * (1 - jaro)
}

/**
 * Returns the optimal string alignment (Damerau-Levenshtein) edit distance
 * between two strings. Adjacent transpositions count as a single edit, so a
 * neighboring-key typo like `japna` → `japan` costs 1 rather than 2.
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const aLength = a.length
  const bLength = b.length
  const distances: number[][] = Array.from({ length: aLength + 1 }, () =>
    new Array<number>(bLength + 1).fill(0),
  )
  for (let i = 0; i <= aLength; i++) {
    distances[i][0] = i
  }
  for (let j = 0; j <= bLength; j++) {
    distances[0][j] = j
  }
  for (let i = 1; i <= aLength; i++) {
    for (let j = 1; j <= bLength; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + substitutionCost,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distances[i][j] = Math.min(distances[i][j], distances[i - 2][j - 2] + 1)
      }
    }
  }
  return distances[aLength][bLength]
}

/**
 * Returns true when two normalized names are a hard-coded confusable pair
 * that must never be accepted as a correct guess for one another, regardless
 * of how similar a generic similarity/editing rule considers them.
 */
export function isExcludedGuessPair(a: string, b: string): boolean {
  if (a === b) {
    return false
  }
  return USER_GUESS_EXCLUDED_PAIRS.has(a < b ? `${a}|${b}` : `${b}|${a}`)
}

/**
 * Centralized service that decides whether a player's guess is close enough
 * to a country's name to count as correct. Normalization and fuzzy matching
 * live here, never in components or game-logic files.
 */
export class GuessChecker {
  private readonly minPercentMatch: number
  private readonly maxEditDistance: number

  constructor(config: Partial<GuessCheckerConfig> = GUESS_CHECKER_CONFIG) {
    const resolved = { ...GUESS_CHECKER_CONFIG, ...config }
    this.minPercentMatch = resolved.minPercentMatch
    this.maxEditDistance = resolved.maxEditDistance
  }

  isCorrect(guess: string, countryName: string): boolean {
    const normalizedGuess = normalizeGuess(guess)
    if (normalizedGuess === '') {
      return false
    }
    return countryNameVariants(countryName).some(
      (variant) =>
        !isExcludedGuessPair(normalizedGuess, variant) &&
        jaroWinklerSimilarity(normalizedGuess, variant) >=
          this.minPercentMatch &&
        damerauLevenshteinDistance(normalizedGuess, variant) <=
          this.maxEditDistance,
    )
  }

  /**
   * Returns the best accepted match percentage (0-100) between a guess and a
   * country name: the highest Jaro-Winkler similarity, rounded to a whole
   * percent, among the country-name variants that satisfy the same similarity,
   * edit-distance, and exclusion gates as `isCorrect`. Returns `null` when no
   * variant is accepted (the guess is not correct). An exact normalized match
   * reports `100`.
   */
  matchPercent(guess: string, countryName: string): number | null {
    const normalizedGuess = normalizeGuess(guess)
    if (normalizedGuess === '') {
      return null
    }
    let bestSimilarity = 0
    let found = false
    for (const variant of countryNameVariants(countryName)) {
      if (isExcludedGuessPair(normalizedGuess, variant)) {
        continue
      }
      const similarity = jaroWinklerSimilarity(normalizedGuess, variant)
      if (
        similarity >= this.minPercentMatch &&
        damerauLevenshteinDistance(normalizedGuess, variant) <=
          this.maxEditDistance
      ) {
        found = true
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity
        }
      }
    }
    return found ? Math.round(bestSimilarity * 100) : null
  }
}
