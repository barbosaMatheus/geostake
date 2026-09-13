# ISO TopoJSON Outline Coverage

## Summary

| Metric | Count | Percentage |
|---|---:|---:|
| Canonical countries | 230 | 100.0% |
| Countries with outlines | 230 | 100.0% |
| Countries without outlines | 0 | 0.0% |

## Missing Outlines

None.

## Methodology

- Source: `@rembish/iso-topojson@1.4.0`.
- The canonical GeoStake dataset keys countries by FactsBook GEC (formerly
  FIPS) codes, not ISO 3166-1 alpha-2 codes. Each country's ISO alpha-2 code is
  derived deterministically from its FactsBook `internetCountryCode` field,
  with two documented exceptions: United Kingdom → `GB` and France → `FR`.
- Verified the installed package's actual structure before matching: it is a
  standard TopoJSON document (`type`, `arcs`, `transform`,
  `objects.merged` geometry collection of 250 Polygon/MultiPolygon
  geometries), each geometry carrying `properties` with `iso_a2`, `iso_a3`,
  `name`, and `sovereign`. A country is counted as covered when a geometry
  with a matching `iso_a2` exists and has a non-empty `arcs` array.
- Compatibility note: the package's package.json `main` is the JSON file
  itself (`iso-a2.json`), so an ESM `import` fails with
  `ERR_IMPORT_ATTRIBUTE_MISSING`. The test loads it via
  `createRequire(import.meta.url)`, which resolves the `main` field and
  parses the JSON directly.
- Command: `npm run check:outline-coverage` (script:
  `scripts/checkOutlineCoverage.ts`). Output is this report.
