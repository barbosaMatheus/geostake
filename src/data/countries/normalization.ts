import type { Country, Hemisphere } from '../../types/country.ts'

export const HEMISPHERES: readonly Hemisphere[] = [
  'Northern-Eastern',
  'Northern-Western',
  'Southern-Eastern',
  'Southern-Western',
]

const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  aacute: '\u00e1',
  Aacute: '\u00c1',
  acirc: '\u00e2',
  agrave: '\u00e0',
  amp: '&',
  aring: '\u00e5',
  atilde: '\u00e3',
  auml: '\u00e4',
  ccedil: '\u00e7',
  eacute: '\u00e9',
  Eacute: '\u00c9',
  ecirc: '\u00ea',
  egrave: '\u00e8',
  euml: '\u00eb',
  iacute: '\u00ed',
  Iacute: '\u00cd',
  icirc: '\u00ee',
  iuml: '\u00ef',
  ldquo: '\u201c',
  lsquo: '\u2018',
  mdash: '\u2014',
  nbsp: '\u00a0',
  ndash: '\u2013',
  ntilde: '\u00f1',
  Ntilde: '\u00d1',
  oacute: '\u00f3',
  Oacute: '\u00d3',
  ocirc: '\u00f4',
  ograve: '\u00f2',
  oslash: '\u00f8',
  Oslash: '\u00d8',
  otilde: '\u00f5',
  ouml: '\u00f6',
  Ouml: '\u00d6',
  quot: '"',
  rdquo: '\u201d',
  rsquo: '\u2019',
  scaron: '\u0161',
  Scaron: '\u0160',
  szlig: '\u00df',
  uacute: '\u00fa',
  Uacute: '\u00da',
  ucirc: '\u00fb',
  uuml: '\u00fc',
  apos: "'",
  gt: '>',
  lt: '<',
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, (full, code) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    }
    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    }
    return HTML_ENTITY_MAP[code] ?? full
  })
}

export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

export function cleanText(text: string): string {
  return decodeHtmlEntities(stripHtmlTags(text))
    .replaceAll('\u00a0', ' ')
    .trim()
}

const NUMBER_PATTERN = /-?\d[\d,]*(?:\.\d+)?/

export function extractFirstNumber(text: string): number | null {
  const cleaned = stripHtmlTags(decodeHtmlEntities(text))
  const match = cleaned.match(NUMBER_PATTERN)
  if (match === null) {
    return null
  }
  const value = Number(match[0].replaceAll(',', ''))
  return Number.isFinite(value) ? value : null
}

export function parsePopulation(text: string | undefined): number | null {
  if (text === undefined) {
    return null
  }
  const value = extractFirstNumber(text)
  return value === null || value <= 0 ? null : value
}

export function parseLandAreaKm2(text: string | undefined): number | null {
  if (text === undefined) {
    return null
  }
  const cleaned = cleanText(text)
  const match = cleaned.match(NUMBER_PATTERN)
  if (match === null) {
    return null
  }
  const value = Number(match[0].replaceAll(',', ''))
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  const trailing = cleaned.slice(match.index! + match[0].length)
  return /^\s*million/i.test(trailing) ? value * 1_000_000 : value
}

export function parseOptionalNumeric(
  text: string | undefined,
): number | undefined {
  if (text === undefined) {
    return undefined
  }
  const value = extractFirstNumber(text)
  return value === null ? undefined : value
}

export function extractNonEmptyText(text: string | undefined): string | null {
  if (text === undefined) {
    return null
  }
  const cleaned = cleanText(text)
  return cleaned.length > 0 ? cleaned : null
}

export function parseNationalColors(
  value: string | undefined,
): string[] | undefined {
  if (value === undefined) {
    return undefined
  }
  let text = cleanText(value)
  const marker = text.toLowerCase().indexOf('national colors:')
  if (marker !== -1) {
    text = text.slice(marker + 'national colors:'.length).split(';')[0]
  }
  const colors = text
    .split(',')
    .map((color) => color.replace(/\([^)]*\)/g, '').trim())
    .filter((color) => color.length > 0)
  return colors.length > 0 ? colors : undefined
}

export function extractInternetCountryCode(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined
  }
  const code = cleanText(value)
  return code.length > 0 ? code : undefined
}

const COORDINATE_PATTERN =
  /(-?\d{1,3})(?:\s+(\d{1,2}))?(?:\s+(\d{1,2}))?\s*([NSEW])/g

type NorthSouth = 'N' | 'S'
type EastWest = 'E' | 'W'

export function parseHemisphere(text: string): Hemisphere | null {
  const cleaned = stripHtmlTags(decodeHtmlEntities(text))
  let lat: { dir: NorthSouth; degrees: number } | null = null
  let lon: { dir: EastWest; degrees: number } | null = null
  for (const match of cleaned.matchAll(COORDINATE_PATTERN)) {
    const degrees = Number(match[1])
    const direction = match[4] as NorthSouth | EastWest
    if ((direction === 'N' || direction === 'S') && lat === null) {
      lat = { dir: direction, degrees }
    } else if ((direction === 'E' || direction === 'W') && lon === null) {
      lon = { dir: direction, degrees }
    }
    if (lat !== null && lon !== null) {
      break
    }
  }
  if (lat === null || lon === null) {
    return null
  }
  if (lat.degrees > 90 || lon.degrees > 180) {
    return null
  }
  const northSouth = lat.dir === 'N' ? 'Northern' : 'Southern'
  const eastWest = lon.dir === 'E' ? 'Eastern' : 'Western'
  const hemisphere = `${northSouth}-${eastWest}` as Hemisphere
  return HEMISPHERES.includes(hemisphere) ? hemisphere : null
}

export function isHemisphere(value: string): value is Hemisphere {
  return (HEMISPHERES as readonly string[]).includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function collectTextValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (isRecord(value)) {
    return Object.values(value).flatMap((child) => collectTextValues(child))
  }
  return []
}

export function parseHemisphereFromNode(node: unknown): Hemisphere | null {
  for (const text of collectTextValues(node)) {
    const hemisphere = parseHemisphere(text)
    if (hemisphere !== null) {
      return hemisphere
    }
  }
  return null
}

export function readTextField(node: unknown): string | undefined {
  if (!isRecord(node)) {
    return undefined
  }
  const text = node['text']
  return typeof text === 'string' ? text : undefined
}

function readNode(node: unknown, path: readonly string[]): unknown {
  let current: unknown = node
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined
    }
    current = current[key]
  }
  return current
}

export function getTextField(
  document: Record<string, unknown>,
  path: readonly string[],
): string | undefined {
  const value = readNode(document, path)
  return typeof value === 'string' ? value : undefined
}

export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

export function deterministicRandom(seed: string): () => number {
  return () => hashString(seed) / 0xffffffff
}

type ClueFacts = Pick<
  Country,
  'population' | 'landAreaKm2' | 'hemisphere' | 'region'
>

const CLUE_BUILDERS: ReadonlyArray<(facts: ClueFacts) => string> = [
  (facts) =>
    `Its population is approximately ${facts.population.toLocaleString('en-US')}.`,
  (facts) =>
    `Its land area is approximately ${facts.landAreaKm2.toLocaleString('en-US')} square kilometers.`,
  (facts) => `It lies in the ${facts.hemisphere} hemisphere.`,
  (facts) => `It is located in ${facts.region}.`,
]

export function generateStartingClue(
  facts: ClueFacts,
  seed: string,
  random: () => number = deterministicRandom(seed),
): string {
  const index = Math.floor(random() * CLUE_BUILDERS.length)
  const clamped = Math.min(CLUE_BUILDERS.length - 1, Math.max(0, index))
  return CLUE_BUILDERS[clamped](facts)
}

export interface NormalizationResult {
  readonly country: Country | undefined
  readonly problems: readonly string[]
}

function describe(value: string | undefined): string {
  return value === undefined ? 'missing field' : `"${value}"`
}

function extractCountryName(document: Record<string, unknown>): string | null {
  const nameNode = readNode(document, ['Government', 'Country name'])
  const shortForm = extractNonEmptyText(
    readTextField(readNode(nameNode, ['conventional short form'])),
  )
  if (shortForm !== null && shortForm.toLowerCase() !== 'none') {
    return shortForm
  }
  const longForm = extractNonEmptyText(
    readTextField(readNode(nameNode, ['conventional long form'])),
  )
  if (longForm !== null && longForm.toLowerCase() !== 'none') {
    return longForm
  }
  return null
}

function readPopulationText(
  document: Record<string, unknown>,
): string | undefined {
  const population = readNode(document, ['People and Society', 'Population'])
  const flat = readTextField(population)
  if (flat !== undefined) {
    return flat
  }
  return readTextField(readNode(population, ['total']))
}

export function normalizeCountryFile(
  id: string,
  document: unknown,
): NormalizationResult {
  const problems: string[] = []
  if (!isRecord(document)) {
    return {
      country: undefined,
      problems: [
        `document: expected an object but received ${typeof document}`,
      ],
    }
  }

  const name = extractCountryName(document)
  if (name === null) {
    problems.push('name: could not determine a country name')
  }

  const populationText = readPopulationText(document)
  const population = parsePopulation(populationText)
  if (population === null) {
    problems.push(
      `population: expected a positive number, got ${describe(populationText)}`,
    )
  }

  const landAreaText = getTextField(document, [
    'Geography',
    'Area',
    'land',
    'text',
  ])
  const landAreaKm2 = parseLandAreaKm2(landAreaText)
  if (landAreaKm2 === null) {
    problems.push(
      `landAreaKm2: expected a positive land area in square kilometers, got ${describe(landAreaText)}`,
    )
  }

  const region = extractNonEmptyText(
    getTextField(document, ['Geography', 'Map references', 'text']),
  )
  if (region === null) {
    problems.push('region: missing Map references value')
  }

  const hemisphere = parseHemisphereFromNode(
    readNode(document, ['Geography', 'Geographic coordinates']),
  )
  if (hemisphere === null) {
    problems.push(
      'hemisphere: could not parse a hemisphere from Geographic coordinates',
    )
  }

  const capital = extractNonEmptyText(
    getTextField(document, ['Government', 'Capital', 'name', 'text']),
  )
  if (capital === null) {
    problems.push('capital: missing Capital name')
  }

  if (
    name === null ||
    population === null ||
    landAreaKm2 === null ||
    region === null ||
    hemisphere === null ||
    capital === null
  ) {
    return { country: undefined, problems }
  }

  const coastlineKm = parseOptionalNumeric(
    getTextField(document, ['Geography', 'Coastline', 'text']),
  )
  const lowestElevationM = parseOptionalNumeric(
    getTextField(document, ['Geography', 'Elevation', 'lowest point', 'text']),
  )
  const highestElevationM = parseOptionalNumeric(
    getTextField(document, ['Geography', 'Elevation', 'highest point', 'text']),
  )
  const internetCountryCode = extractInternetCountryCode(
    getTextField(document, ['Communications', 'Internet country code', 'text']),
  )
  const nationalColors = parseNationalColors(
    getTextField(document, ['Government', 'National color(s)', 'text']),
  )

  const country: Country = {
    id,
    name,
    population,
    landAreaKm2,
    region,
    hemisphere,
    populationDensity: population / landAreaKm2,
    capital,
    flag: `assets/flags/${id.toUpperCase()}.svg`,
    outline: `assets/outlines/${id.toUpperCase()}.svg`,
    startingClue: generateStartingClue(
      { population, landAreaKm2, hemisphere, region },
      id,
    ),
  }

  return {
    country: {
      ...country,
      ...(coastlineKm !== undefined ? { coastlineKm } : {}),
      ...(lowestElevationM !== undefined ? { lowestElevationM } : {}),
      ...(highestElevationM !== undefined ? { highestElevationM } : {}),
      ...(internetCountryCode !== undefined ? { internetCountryCode } : {}),
      ...(nationalColors !== undefined ? { nationalColors } : {}),
    },
    problems,
  }
}

export function isCompleteCountry(value: unknown): value is Country {
  if (!isRecord(value)) {
    return false
  }
  const hemisphere = value['hemisphere']
  return (
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['population'] === 'number' &&
    typeof value['landAreaKm2'] === 'number' &&
    typeof value['region'] === 'string' &&
    typeof hemisphere === 'string' &&
    isHemisphere(hemisphere) &&
    typeof value['populationDensity'] === 'number' &&
    typeof value['capital'] === 'string'
  )
}
