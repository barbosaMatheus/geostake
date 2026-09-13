import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isoCodeOf } from './gecToIso.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const COUNTRIES_JSON = path.join(
  PROJECT_ROOT,
  'src',
  'data',
  'countries',
  'countries.json',
)
const REPORT_PATH = path.join(PROJECT_ROOT, 'vis-clues-outline-results.md')

interface CanonicalCountry {
  id: string
  name: string
  internetCountryCode?: string
}

interface TopoJsonProperty {
  iso_a2: string
  iso_a3: string
  iso_n3: number
  name: string
  sovereign: string
  type: string
}

interface TopoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon'
  arcs: unknown[]
  properties: TopoJsonProperty
}

interface IsoTopoJson {
  type: string
  arcs: unknown[]
  transform: unknown
  objects: {
    merged: {
      type: 'GeometryCollection'
      geometries: TopoJsonGeometry[]
    }
  }
}

/**
 * @rembish/iso-topojson is published with its package.json "main" pointing at
 * the topojson JSON file itself (iso-a2.json). Importing it through ESM fails
 * with ERR_IMPORT_ATTRIBUTE_MISSING (a "type: json" import attribute is
 * required), so it is loaded through createRequire(), which resolves the main
 * field and parses the JSON like a CommonJS module.
 */
function loadIsoTopoJson(): IsoTopoJson {
  const require = createRequire(import.meta.url)
  return require('@rembish/iso-topojson') as IsoTopoJson
}

function isUsableGeometry(geometry: TopoJsonGeometry): boolean {
  return geometry.arcs !== undefined && geometry.arcs.length > 0
}

function percent(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(1)}%`
}

function outlineCoverage(): {
  total: number
  withOutline: number
  withoutOutline: number
  missing: { country: CanonicalCountry; iso: string }[]
} {
  const countries = JSON.parse(
    readFileSync(COUNTRIES_JSON, 'utf8'),
  ) as CanonicalCountry[]
  const topojson = loadIsoTopoJson()

  const geometryByIso = new Map<string, TopoJsonGeometry>()
  for (const geometry of topojson.objects.merged.geometries) {
    geometryByIso.set(geometry.properties.iso_a2.toUpperCase(), geometry)
  }

  const missing: { country: CanonicalCountry; iso: string }[] = []
  const seenIso = new Map<string, string>()

  for (const country of countries) {
    const iso = isoCodeOf(country)
    const duplicate = seenIso.get(iso)
    if (duplicate !== undefined) {
      throw new Error(
        `Two canonical countries map to ISO code "${iso}": "${duplicate}" and "${country.id}"`,
      )
    }
    seenIso.set(iso, country.id)

    const geometry = geometryByIso.get(iso)
    if (geometry === undefined || !isUsableGeometry(geometry)) {
      missing.push({ country, iso })
    }
  }

  return {
    total: countries.length,
    withOutline: countries.length - missing.length,
    withoutOutline: missing.length,
    missing,
  }
}

function renderReport(result: {
  total: number
  withOutline: number
  withoutOutline: number
  missing: { country: CanonicalCountry; iso: string }[]
}): string {
  const missingLines =
    result.missing.length === 0
      ? 'None.'
      : result.missing.map((m) => `- ${m.country.name} (${m.iso})`).join('\n')

  return `# ISO TopoJSON Outline Coverage

## Summary

| Metric | Count | Percentage |
|---|---:|---:|
| Canonical countries | ${result.total} | 100.0% |
| Countries with outlines | ${result.withOutline} | ${percent(result.withOutline, result.total)} |
| Countries without outlines | ${result.withoutOutline} | ${percent(result.withoutOutline, result.total)} |

## Missing Outlines

${missingLines}

## Methodology

- Source: \`@rembish/iso-topojson@1.4.0\`.
- The canonical GeoStake dataset keys countries by FactsBook GEC (formerly
  FIPS) codes, not ISO 3166-1 alpha-2 codes. Each country's ISO alpha-2 code is
  derived deterministically from its FactsBook \`internetCountryCode\` field,
  with two documented exceptions: United Kingdom → \`GB\` and France → \`FR\`.
- Verified the installed package's actual structure before matching: it is a
  standard TopoJSON document (\`type\`, \`arcs\`, \`transform\`,
  \`objects.merged\` geometry collection of 250 Polygon/MultiPolygon
  geometries), each geometry carrying \`properties\` with \`iso_a2\`, \`iso_a3\`,
  \`name\`, and \`sovereign\`. A country is counted as covered when a geometry
  with a matching \`iso_a2\` exists and has a non-empty \`arcs\` array.
- Compatibility note: the package's package.json \`main\` is the JSON file
  itself (\`iso-a2.json\`), so an ESM \`import\` fails with
  \`ERR_IMPORT_ATTRIBUTE_MISSING\`. The test loads it via
  \`createRequire(import.meta.url)\`, which resolves the \`main\` field and
  parses the JSON directly.
- Command: \`npm run check:outline-coverage\` (script:
  \`scripts/checkOutlineCoverage.ts\`). Output is this report.
`
}

function printRow(category: string, count: number, pct: string): void {
  console.log(
    `${category.padEnd(32)} ${String(count).padStart(6)} ${pct.padStart(9)}`,
  )
}

function main(): void {
  const result = outlineCoverage()

  writeFileSync(REPORT_PATH, renderReport(result), 'utf8')

  console.log('# ISO TopoJSON Outline Coverage')
  console.log()
  printRow('Metric', 0, 'Count %')
  console.log('-'.repeat(52))
  printRow('Canonical countries', result.total, '100.0%')
  printRow(
    'Countries with outlines',
    result.withOutline,
    percent(result.withOutline, result.total),
  )
  printRow(
    'Countries without outlines',
    result.withoutOutline,
    percent(result.withoutOutline, result.total),
  )
  console.log()
  for (const m of result.missing) {
    console.log(`Missing outline: ${m.country.name} (${m.iso})`)
  }
  console.log(`Report written to ${REPORT_PATH}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
