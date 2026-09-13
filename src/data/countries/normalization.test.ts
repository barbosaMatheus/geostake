import { describe, expect, it } from 'vitest'
import type { Country, Hemisphere } from '../../types/country.ts'
import canonicalCountries from './countries.json'
import ayFixture from './fixtures/ay.json'
import giFixture from './fixtures/gi.json'
import tbFixture from './fixtures/tb.json'
import {
  extractFirstNumber,
  extractInternetCountryCode,
  extractNonEmptyText,
  generateStartingClue,
  isCompleteCountry,
  normalizeCountryFile,
  parseHemisphere,
  parseLandAreaKm2,
  parseNationalColors,
  parseOptionalNumeric,
  parsePopulation,
} from './normalization.ts'

function baseDocument(): Record<string, unknown> {
  return {
    Geography: {
      Area: { land: { text: '100,000 sq km' } },
      Coastline: { text: '1,000 km' },
      Elevation: {
        'lowest point': { text: 'Sea 0 m' },
        'highest point': { text: 'Mount Peak 2,500 m' },
      },
      'Geographic coordinates': { text: '10 00 N, 20 00 E' },
      'Map references': { text: 'Test Region' },
    },
    Government: {
      Capital: { name: { text: 'Testopolis' } },
      'Country name': {
        'conventional short form': { text: 'Testia' },
      },
      'National color(s)': { text: 'red, white, blue' },
    },
    'People and Society': {
      Population: { total: { text: '10,000,000 (2025 est.)' } },
    },
    Communications: {
      'Internet country code': { text: '.tt' },
    },
  }
}

function without(
  document: Record<string, unknown>,
  ...path: string[]
): Record<string, unknown> {
  const copy = structuredClone(document)
  let node: Record<string, unknown> | undefined = copy
  for (const key of path.slice(0, -1)) {
    const child = node?.[key]
    if (typeof child === 'object' && child !== null) {
      node = child as Record<string, unknown>
    } else {
      node = undefined
    }
  }
  if (node !== undefined) {
    delete node[path[path.length - 1]]
  }
  return copy
}

describe('population parsing', () => {
  it('extracts the leading number and strips formatting', () => {
    expect(parsePopulation('39,542,166 (July 2015 est.)')).toBe(39542166)
    expect(parsePopulation('338,016,259 (2025 est.)')).toBe(338016259)
  })

  it('requires a positive number', () => {
    expect(parsePopulation('0 residents')).toBeNull()
    expect(parsePopulation('no permanent inhabitants')).toBeNull()
    expect(parsePopulation('uninhabited')).toBeNull()
    expect(parsePopulation(undefined)).toBeNull()
  })

  it('extracts the first number from free text', () => {
    expect(extractFirstNumber('-86 m')).toBe(-86)
    expect(extractFirstNumber('2,994 m')).toBe(2994)
    expect(extractFirstNumber('no numbers here')).toBeNull()
  })
})

describe('land area parsing', () => {
  it('parses square kilometers and ignores units and annotations', () => {
    expect(parseLandAreaKm2('2,381,741 sq km')).toBe(2381741)
    expect(parseLandAreaKm2('6.5 sq km')).toBe(6.5)
    expect(parseLandAreaKm2('19,924 km')).toBe(19924)
  })

  it('expands "million square kilometers" values', () => {
    expect(
      parseLandAreaKm2('14.2 million sq km (285,000 sq km ice-free)'),
    ).toBe(14200000)
  })

  it('rejects missing or non-positive values', () => {
    expect(parseLandAreaKm2('NA')).toBeNull()
    expect(parseLandAreaKm2('0 sq km')).toBeNull()
    expect(parseLandAreaKm2(undefined)).toBeNull()
  })
})

describe('region and capital extraction', () => {
  it('cleans and trims map-reference style values', () => {
    expect(extractNonEmptyText(' North America ')).toBe('North America')
    expect(extractNonEmptyText('South America')).toBe('South America')
  })

  it('returns null for missing or empty values', () => {
    expect(extractNonEmptyText(undefined)).toBeNull()
    expect(extractNonEmptyText('')).toBeNull()
    expect(extractNonEmptyText('   ')).toBeNull()
  })
})

describe('geographic coordinate parsing', () => {
  it('parses degree-minute coordinates with directional suffixes', () => {
    expect(parseHemisphere('38 00 N, 97 00 W')).toBe('Northern-Western')
    expect(parseHemisphere('42 50 N, 12 50 E')).toBe('Northern-Eastern')
    expect(parseHemisphere('10 00 S, 55 00 W')).toBe('Southern-Western')
    expect(parseHemisphere('10 00 S, 55 00 E')).toBe('Southern-Eastern')
  })

  it('handles HTML-wrapped multi-territory coordinate strings', () => {
    const france =
      '<strong>metropolitan France:</strong> 46 00 N, 2 00 E <br><br>' +
      '<strong>French Guiana:</strong> 4 00 N, 53 00 W'
    expect(parseHemisphere(france)).toBe('Northern-Eastern')
  })

  it('handles zero-degree coordinates without losing the direction', () => {
    expect(parseHemisphere('90 00 S, 0 00 E')).toBe('Southern-Eastern')
  })

  it('rejects unparseable or partial coordinates', () => {
    expect(parseHemisphere('not a coordinate')).toBeNull()
    expect(parseHemisphere('38 00 N')).toBeNull()
    expect(parseHemisphere('97 00 W')).toBeNull()
  })

  it('rejects out-of-range degree values', () => {
    expect(parseHemisphere('120 00 N, 200 00 W')).toBeNull()
  })

  it('covers all four hemispheres', () => {
    const cases: ReadonlyArray<[string, Hemisphere]> = [
      ['46 00 N, 2 00 E', 'Northern-Eastern'],
      ['38 00 N, 97 00 W', 'Northern-Western'],
      ['10 00 S, 55 00 E', 'Southern-Eastern'],
      ['10 00 S, 55 00 W', 'Southern-Western'],
    ]
    for (const [input, expected] of cases) {
      expect(parseHemisphere(input)).toBe(expected)
    }
  })
})

describe('national colors parsing', () => {
  it('splits a comma-separated color list', () => {
    expect(parseNationalColors('red, white, blue')).toEqual([
      'red',
      'white',
      'blue',
    ])
  })

  it('removes parenthetical annotations from individual colors', () => {
    expect(parseNationalColors('red (ochre), white')).toEqual(['red', 'white'])
    expect(parseNationalColors('red (symbolizing peace), white, blue')).toEqual(
      ['red', 'white', 'blue'],
    )
  })

  it('handles an embedded "national colors:" marker', () => {
    expect(parseNationalColors('national colors: green, white, red')).toEqual([
      'green',
      'white',
      'red',
    ])
  })

  it('returns undefined for empty or missing values', () => {
    expect(parseNationalColors(undefined)).toBeUndefined()
    expect(parseNationalColors('')).toBeUndefined()
    expect(parseNationalColors('()')).toBeUndefined()
  })
})

describe('optional numeric fields', () => {
  it('parses coastline values and preserves zero', () => {
    expect(parseOptionalNumeric('19,924 km')).toBe(19924)
    expect(parseOptionalNumeric('0 km')).toBe(0)
  })

  it('leaves unparseable values undefined', () => {
    expect(parseOptionalNumeric('NA')).toBeUndefined()
    expect(parseOptionalNumeric(undefined)).toBeUndefined()
  })

  it('parses lowest and highest elevation from prose', () => {
    expect(parseOptionalNumeric('Death Valley (lowest point) -86 m')).toBe(-86)
    expect(parseOptionalNumeric('Atlantic Ocean 0 m')).toBe(0)
    expect(parseOptionalNumeric('Mount McKinley 6,190 m')).toBe(6190)
  })
})

describe('internet country code extraction', () => {
  it('preserves the trimmed code', () => {
    expect(extractInternetCountryCode(' .us ')).toBe('.us')
    expect(extractInternetCountryCode('.za')).toBe('.za')
  })

  it('returns undefined when missing or empty', () => {
    expect(extractInternetCountryCode(undefined)).toBeUndefined()
    expect(extractInternetCountryCode('')).toBeUndefined()
    expect(extractInternetCountryCode('   ')).toBeUndefined()
  })
})

describe('normalizeCountryFile', () => {
  it('builds a complete country from a valid document', () => {
    const result = normalizeCountryFile('tt', baseDocument())

    expect(result.problems).toEqual([])
    expect(result.country).toMatchObject({
      id: 'tt',
      name: 'Testia',
      population: 10000000,
      landAreaKm2: 100000,
      region: 'Test Region',
      hemisphere: 'Northern-Eastern',
      populationDensity: 100,
      capital: 'Testopolis',
      coastlineKm: 1000,
      lowestElevationM: 0,
      highestElevationM: 2500,
      internetCountryCode: '.tt',
      nationalColors: ['red', 'white', 'blue'],
      flag: 'assets/flags/TT.svg',
      outline: 'assets/outlines/TT.svg',
    })
    expect(result.country?.startingClue.length).toBeGreaterThan(0)
  })

  it('decodes HTML entities in text fields', () => {
    const document = baseDocument()
    ;(document.Government as Record<string, unknown>).Capital = {
      name: { text: 'Bras&iacute;lia' },
    }
    const result = normalizeCountryFile('br', document)
    expect(result.country?.capital).toBe('Brasília')
  })

  it('uses the conventional long form when the short form is "none"', () => {
    const document = baseDocument()
    ;(document.Government as Record<string, unknown>)['Country name'] = {
      'conventional short form': { text: 'none' },
      'conventional long form': { text: 'Federated States of Testia' },
    }
    const result = normalizeCountryFile('tt', document)
    expect(result.country?.name).toBe('Federated States of Testia')
  })

  it('keeps a country when an optional field is missing', () => {
    const document = without(baseDocument(), 'Geography', 'Elevation')
    const result = normalizeCountryFile('tb', document)
    expect(result.country?.id).toBe('tb')
    expect(result.country?.lowestElevationM).toBeUndefined()
    expect(result.country?.highestElevationM).toBeUndefined()
    expect(result.problems).toEqual([])
  })

  it.each([
    [
      'name',
      (doc: Record<string, unknown>) => {
        ;(doc.Government as Record<string, unknown>)['Country name'] = {}
      },
    ],
    [
      'population',
      (doc: Record<string, unknown>) => {
        ;(doc['People and Society'] as Record<string, unknown>).Population = {
          total: { text: 'no permanent inhabitants' },
        }
      },
    ],
    [
      'landAreaKm2',
      (doc: Record<string, unknown>) => {
        ;(
          (doc.Geography as Record<string, unknown>).Area as Record<
            string,
            unknown
          >
        ).land = { text: 'NA' }
      },
    ],
    [
      'region',
      (doc: Record<string, unknown>) => {
        ;(doc.Geography as Record<string, unknown>)['Map references'] = {}
      },
    ],
    [
      'hemisphere',
      (doc: Record<string, unknown>) => {
        ;(doc.Geography as Record<string, unknown>)['Geographic coordinates'] =
          {}
      },
    ],
    [
      'capital',
      (doc: Record<string, unknown>) => {
        ;(doc.Government as Record<string, unknown>).Capital = {}
      },
    ],
  ])('excludes the country when %s is missing', (field, mutate) => {
    const document = baseDocument()
    mutate(document)
    const result = normalizeCountryFile('tt', document)
    expect(result.country).toBeUndefined()
    expect(result.problems.join('\n')).toContain(field)
  })

  it('rejects a non-object document', () => {
    const result = normalizeCountryFile('xx', 'not an object')
    expect(result.country).toBeUndefined()
    expect(result.problems.length).toBeGreaterThan(0)
  })
})

describe('starting clue generation', () => {
  const facts = {
    population: 10000000,
    landAreaKm2: 100000,
    hemisphere: 'Northern-Eastern' as Hemisphere,
    region: 'Test Region',
  }

  it('builds each of the four clue types', () => {
    expect(generateStartingClue(facts, 'seed', () => 0)).toBe(
      'Its population is approximately 10,000,000.',
    )
    expect(generateStartingClue(facts, 'seed', () => 0.25)).toBe(
      'Its land area is approximately 100,000 square kilometers.',
    )
    expect(generateStartingClue(facts, 'seed', () => 0.5)).toBe(
      'It lies in the Northern-Eastern hemisphere.',
    )
    expect(generateStartingClue(facts, 'seed', () => 0.75)).toBe(
      'It is located in Test Region.',
    )
  })

  it('never reveals the country name', () => {
    const country = normalizeCountryFile('us', baseDocument())
      .country as Country
    for (let i = 0; i < 20; i++) {
      const clue = generateStartingClue(
        {
          population: country.population,
          landAreaKm2: country.landAreaKm2,
          hemisphere: country.hemisphere,
          region: country.region,
        },
        country.id,
        () => i / 20,
      )
      expect(clue.toLowerCase()).not.toContain(country.name.toLowerCase())
    }
  })

  it('is deterministic for a given seed', () => {
    expect(generateStartingClue(facts, 'br')).toBe(
      generateStartingClue(facts, 'br'),
    )
  })
})

describe('real FactsBook country files', () => {
  it('normalizes the Gibraltar record', () => {
    const result = normalizeCountryFile('gi', giFixture)
    expect(result.problems).toEqual([])
    expect(result.country).toMatchObject({
      id: 'gi',
      name: 'Gibraltar',
      population: 29733,
      landAreaKm2: 6.5,
      region: 'Europe',
      hemisphere: 'Northern-Western',
      capital: 'Gibraltar',
      coastlineKm: 12,
      lowestElevationM: 0,
      highestElevationM: 426,
      internetCountryCode: '.gi',
      nationalColors: ['red', 'white', 'yellow'],
    })
  })

  it('retains Saint Barthelemy when optional fields are absent', () => {
    const result = normalizeCountryFile('tb', tbFixture)
    expect(result.problems).toEqual([])
    expect(result.country?.name).toBe('Saint Barthelemy')
    expect(result.country?.nationalColors).toBeUndefined()
    expect(result.country?.coastlineKm).toBeUndefined()
    expect(result.country?.landAreaKm2).toBeGreaterThan(0)
  })

  it('excludes Antarctica for a missing required capital', () => {
    const result = normalizeCountryFile('ay', ayFixture)
    expect(result.country).toBeUndefined()
    expect(result.problems.join('\n')).toContain('capital')
  })
})

describe('canonical country dataset', () => {
  it('contains only records that pass required-field validation', () => {
    expect(canonicalCountries.length).toBeGreaterThan(150)
    for (const record of canonicalCountries) {
      expect(
        isCompleteCountry(record),
        `record should be complete: ${JSON.stringify(record)}`,
      ).toBe(true)
    }
  })

  it('uses unique two-letter ids', () => {
    const ids = canonicalCountries.map((record) => record.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]{2}$/)
    }
  })

  it('does not include world, meta, or oceans records', () => {
    const ids = new Set(canonicalCountries.map((record) => record.id))
    const excluded = new Set(['xx', 'oo', 'xo', 'xq', 'zh', 'zn'])
    for (const id of excluded) {
      expect(ids.has(id)).toBe(false)
    }
    for (const record of canonicalCountries) {
      expect(record.name.toLowerCase()).not.toBe('world')
    }
  })

  it('includes well-known sovereign countries', () => {
    const ids = new Set(canonicalCountries.map((record) => record.id))
    for (const id of ['us', 'br', 'ja', 'gm', 'fr']) {
      expect(ids.has(id)).toBe(true)
    }
  })
})
