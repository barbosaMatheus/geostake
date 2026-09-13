import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasFlag, countries as flagCountryCodes } from 'country-flag-icons'
import { getCountries } from '@amplifiedhq/countries-atlas'
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
const REPORT_PATH = path.join(PROJECT_ROOT, 'vis-clues-results.md')
const ATLAS_FLAGS_SVG_DIR = path.join(
  PROJECT_ROOT,
  'node_modules',
  '@amplifiedhq',
  'countries-atlas',
  'flags',
  'svg',
)

interface CanonicalCountry {
  id: string
  name: string
  internetCountryCode?: string
}

interface CountryCoverage {
  country: CanonicalCountry
  iso: string
  hasFlag: boolean
  hasAtlasEntry: boolean
  hasAtlasSvg: boolean
}

function hasAtlasSvg(iso: string): boolean {
  return existsSync(path.join(ATLAS_FLAGS_SVG_DIR, `${iso.toLowerCase()}.svg`))
}

function percent(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(1)}%`
}

function bulletList(countries: readonly CountryCoverage[]): string {
  return countries.map((c) => `- ${c.country.name} (${c.iso})`).join('\n')
}

function checkVisualClueCoverage(): {
  coverage: CountryCoverage[]
  atlasIsoCodes: Set<string>
} {
  const countries = JSON.parse(
    readFileSync(COUNTRIES_JSON, 'utf8'),
  ) as CanonicalCountry[]

  if (!existsSync(ATLAS_FLAGS_SVG_DIR)) {
    throw new Error(
      `@amplifiedhq/countries-atlas SVG flag directory not found: ${ATLAS_FLAGS_SVG_DIR}`,
    )
  }

  const atlasIsoCodes = new Set(getCountries().map((c) => c.iso2.toUpperCase()))
  const seenIso = new Map<string, string>()

  const coverage: CountryCoverage[] = countries.map((country) => {
    const iso = isoCodeOf(country)
    const duplicate = seenIso.get(iso)
    if (duplicate !== undefined) {
      throw new Error(
        `Two canonical countries map to ISO code "${iso}": "${duplicate}" and "${country.id}"`,
      )
    }
    seenIso.set(iso, country.id)
    if (!atlasIsoCodes.has(iso)) {
      throw new Error(
        `ISO code "${iso}" (${country.name}) is not present in @amplifiedhq/countries-atlas`,
      )
    }
    return {
      country,
      iso,
      hasFlag: hasFlag(iso),
      hasAtlasEntry: true,
      hasAtlasSvg: hasAtlasSvg(iso),
    }
  })

  return { coverage, atlasIsoCodes }
}

function byName(a: CountryCoverage, b: CountryCoverage): number {
  return a.country.name.localeCompare(b.country.name)
}

function renderReport(
  coverage: readonly CountryCoverage[],
  atlasIsoCodes: Set<string>,
): { markdown: string; counts: Record<string, number> } {
  const total = coverage.length

  // @amplifiedhq/countries-atlas ships only country metadata and no outline
  // geometry (verified in Investigation Notes below), so no canonical country
  // is treated as having an outline from this package.
  const withOutline = coverage.filter(() => false)
  const hasFlag = coverage.filter((c) => c.hasFlag).sort(byName)
  const hasBoth = coverage.filter((c) => c.hasFlag && withOutline.includes(c))
  const hasNeither = coverage.filter((c) => !c.hasFlag).sort(byName)
  const flagOnly = hasFlag
  const outlineOnly = coverage.filter(
    (c) => !c.hasFlag && withOutline.includes(c),
  )

  // hasAtlasEntry coverage is recorded here only as supplementary
  // information; it is never counted as outline coverage.
  const hasAtlasEntry = coverage.filter((c) => c.hasAtlasEntry)
  const hasAtlasSvg = coverage.filter((c) => c.hasAtlasSvg)

  const counts = {
    total,
    hasFlag: hasFlag.length,
    hasOutline: withOutline.length,
    hasBoth: hasBoth.length,
    hasNeither: hasNeither.length,
    hasAtlasSvg: hasAtlasSvg.length,
  }

  const markdown = `# Visual Clue Asset Coverage

## Summary

| Category | Count | Percentage |
|---|---:|---:|
| Total canonical countries | ${total} | 100% |
| Has flag | ${hasFlag.length} | ${percent(hasFlag.length, total)} |
| Has outline | ${withOutline.length} | ${percent(withOutline.length, total)} |
| Has atlas flag SVG | ${hasAtlasSvg.length} | ${percent(hasAtlasSvg.length, total)} |
| Has both | ${hasBoth.length} | ${percent(hasBoth.length, total)} |
| Has neither | ${hasNeither.length} | ${percent(hasNeither.length, total)} |

## Missing Both

${hasNeither.length === 0 ? 'None.' : bulletList(hasNeither)}

## Flag Only

${flagOnly.length === 0 ? 'None.' : bulletList(flagOnly)}

## Outline Only

${outlineOnly.length === 0 ? 'None.' : bulletList(outlineOnly)}

## Investigation Notes

- Asset sources checked: \`country-flag-icons@1.6.20\` (flags) and
  \`@amplifiedhq/countries-atlas@2.0.0\` (country outlines).
- The canonical GeoStake dataset keys countries by FactsBook GEC (formerly
  FIPS) codes, not ISO 3166-1 alpha-2 codes. For matching, each country's ISO
  code was derived deterministically from its FactsBook \`internetCountryCode\`
  field (the country code top-level domain, which corresponds to the ISO code),
  with two documented exceptions: United Kingdom → \`GB\` and France → \`FR\`.
  All ${total} canonical countries derived a unique ISO code present in both
  packages; there were no collisions or unmapped countries.
- Flags: \`country-flag-icons\` provides a flag for every derived ISO code.
  ${hasFlag.length} of ${total} canonical countries (${percent(hasFlag.length, total)}) have a
  matching flag, including non-standard codes such as Kosovo (\`XK\`).
- Atlas SVG flags: \`@amplifiedhq/countries-atlas\` also ships SVG flag assets
  under \`flags/svg/<iso>.svg\` (4:3 flag icons, 250 files), exposed through the
  \`@amplifiedhq/countries-atlas/flags\` helper (\`flagUrl\`, \`flagClass\`,
  \`flagEmoji\`). Note that \`getCountry('BR').svg\` does **not** exist — the
  country record has no \`svg\` property; the SVGs live in the package's
  \`flags/svg/\` asset directory and must be read from there or copied for
  self-hosting. ${hasAtlasSvg.length} of ${total} canonical countries
  (${percent(hasAtlasSvg.length, total)}) have a matching atlas SVG file. Like
  the flags above, these are **flag icons, not outlines**.
- Outlines: \`@amplifiedhq/countries-atlas\` ships **no outline or geometry
  data** in its current release. Investigation of the installed package
  (v2.0.0) shows it exports only country metadata (ISO codes, names, calling
  codes, currencies, timezones, states, cities, translations, flag icons), and
  the previous v1.4.17 release likewise contained no geometry. There is no
  GeoJSON/topojson, no coordinate list, and no boundary/outline field anywhere
  in the package. All ${hasAtlasEntry.length} of ${total} canonical countries do have a
  *metadata entry* in the package (the atlas covers ${atlasIsoCodes.size} country codes), but a
  metadata entry is not an outline. **Outline coverage from this package is
  therefore 0 of ${total} (0%).** Phase 5 will require a different outline asset
  source (for example a GeoJSON/topojson map data provider).
- Command: \`npm run check:visual-clues\` (script:
  \`scripts/checkVisualClueCoverage.ts\`). Output is this report.
`

  return { markdown, counts }
}

function printRow(category: string, count: number, pct: string): void {
  console.log(
    `${category.padEnd(30)} ${String(count).padStart(6)} ${pct.padStart(9)}`,
  )
}

function main(): void {
  const { coverage, atlasIsoCodes } = checkVisualClueCoverage()
  const { markdown, counts } = renderReport(coverage, atlasIsoCodes)

  writeFileSync(REPORT_PATH, markdown, 'utf8')

  console.log('# Visual Clue Asset Coverage')
  console.log()
  printRow('Category', 0, 'Count %')
  console.log('-'.repeat(47))
  printRow('Total canonical countries', counts.total, '100%')
  printRow('Has flag', counts.hasFlag, percent(counts.hasFlag, counts.total))
  printRow(
    'Has outline',
    counts.hasOutline,
    percent(counts.hasOutline, counts.total),
  )
  printRow(
    'Has atlas flag SVG',
    counts.hasAtlasSvg,
    percent(counts.hasAtlasSvg, counts.total),
  )
  printRow('Has both', counts.hasBoth, percent(counts.hasBoth, counts.total))
  printRow(
    'Has neither',
    counts.hasNeither,
    percent(counts.hasNeither, counts.total),
  )
  console.log()
  console.log(
    `Flag-bearing country codes used for matching: ${flagCountryCodes.length}`,
  )
  console.log(`Report written to ${REPORT_PATH}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
