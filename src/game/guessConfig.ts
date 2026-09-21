export const USER_GUESS_MIN_PCT_MATCH = 0.9

export const USER_GUESS_MAX_EDIT_DISTANCE = 1

export interface GuessCheckerConfig {
  minPercentMatch: number
  maxEditDistance: number
}

export const GUESS_CHECKER_CONFIG: GuessCheckerConfig = {
  minPercentMatch: USER_GUESS_MIN_PCT_MATCH,
  maxEditDistance: USER_GUESS_MAX_EDIT_DISTANCE,
}

/**
 * Hard-coded confusable country pairs whose normalized names are a single
 * edit apart (e.g. `iran`/`iraq`), so no similarity threshold can ever reject
 * one while still accepting single-letter typos like `romenia`/`romania`.
 * A country is never considered guessed correctly when the normalized guess
 * matches one side of a pair and the target country variant the other.
 *
 * Keys are the two `normalizeGuess`d names, sorted, joined with `|`.
 */
export const USER_GUESS_EXCLUDED_PAIRS: ReadonlySet<string> = new Set([
  'dominica|dominican',
  'gambia|zambia',
  'iceland|ireland',
  'iran|iraq',
])
