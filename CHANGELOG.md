# Changelog

All notable changes to GeoStake are documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-09-13

### Added

- Five-tier clue system with numeric tiers (0 Free, 1 Low, 2 Medium, 3 High,
  4 Very High): population, land area, population density, and coastline at
  tier 0; region and hemisphere at tier 1; lowest and highest elevation at
  tier 2; capital and national colors at tier 3; internet country code at
  tier 4.
- The clue model is data-driven (`src/game/clueConfig.ts`), so future tiers
  and clues can be added without restructuring the core system.
- Centralized per-tier base costs (0/10/20/50/75) combined with a centralized
  clue cost multiplier (`CLUE_COST_MULTIPLIER`, default `5`) that produces the
  current in-game costs (0/50/100/250/375) and is ready for future difficulty
  modes.
- Pure, unit-tested clue logic (`src/game/clues.ts`): availability, value
  extraction, value formatting, cost calculation, random tier-0 starting-clue
  selection with a population fallback, and clue revealing.
- Game state now tracks the current turn's `startingClueId` and
  `revealedClueIds`; starting a new turn clears the previous turn's revealed
  clues and randomly selects a new free starting clue.
- Clue panel UI grouped by tier showing revealed values, current costs,
  unaffordable/unavailable states, an auto-revealed starting clue marker, and
  per-clue purchase controls that deduct geodes.
- Unit tests for clue tiers, base costs, multiplier math, random
  starting-clue selection, population fallback, availability, value
  extraction, cost deduction, duplicate/unaffordable/unavailable purchase
  protection, and clue-state reset on new turns.

### Changed

- Replaced the single static starting-clue line with the tiered clue area; the
  mystery-country card no longer renders the static `startingClue` string.
- `selectCountry` and clue selection now share a small deterministic random
  helper (`src/game/random.ts`).
- Application version bumped to `0.3.0`.

[0.3.0]: https://github.com/barbosaMatheus/geostake
[0.2.0]: https://github.com/barbosaMatheus/geostake

### Added

- Canonical country dataset generated from the locally cloned `factbook.json`
  repository (CIA World Factbook), replacing the Phase 1 mock dataset.
- Deterministic data-import/normalization pipeline with pure, unit-tested
  parsing functions (`src/data/countries/normalization.ts`) and a generator
  script (`scripts/generateCountries.ts`, `npm run generate:countries`).
- Expanded `Country` type with required fields (`population`, `landAreaKm2`,
  `region`, `hemisphere`, `populationDensity`, `capital`) and optional fields
  (`coastlineKm`, `lowestElevationM`, `highestElevationM`,
  `internetCountryCode`, `nationalColors`), plus `flag`/`outline` asset
  identifiers for future integration.
- Generated static dataset `src/data/countries/countries.json` (230 countries)
  imported directly by the application, with accessor module
  `src/data/countries/index.ts`.
- Automatic generation of each country's `startingClue` from a deterministic
  randomly selected fact (population, land area, hemisphere, or region); clues
  never reveal the country's name.
- Exclusion diagnostics in `src/data/countries/EXCLUDED.md` documenting
  records that could not be normalized and the fields that caused exclusion.
- Unit tests for all normalization rules, including real FactsBook fixture
  files (`src/data/countries/fixtures/`).

### Changed

- Application now loads the canonical country dataset instead of the temporary
  mock dataset; `src/data/mockCountries.ts` removed and replaced with a shared
  test fixture (`src/tests/fixtures.ts`).

[0.2.0]: https://github.com/barbosaMatheus/geostake

## [0.1.0] - 2026-09-11

### Added

- First usable game screen with GeoStake header, geodes and lives display,
  mystery country section, clue display, country guess input, guess feedback,
  and a "Start Next Turn" control.
- Strongly typed domain models: `Country`, `GameState`, `PlayerState`,
  `GuessResult`, and support types.
- Pure, unit-testable game logic for initializing a game, evaluating guesses,
  applying life loss, and starting a new turn (`src/game`).
- Centralized `GAME_CONFIG` with the starting geode and life values.
- Temporary mock country dataset (`src/data/mockCountries.ts`), kept separate
  from the canonical dataset planned for a later phase.
- `useGame` hook connecting the game logic to React components.
- Unit tests for game-logic state transitions and the game screen UI.
- Initial gameplay styling (responsive, tablet-friendly cards and controls).

[0.1.0]: https://github.com/barbosaMatheus/geostake

## [0.0.0] - 2026-09-11

### Added

- Initial GeoStake project scaffolding.
- Vite + React + TypeScript application setup.
- Initial project directory structure for components, game logic, data, hooks, services, types, styles, and tests.
- Basic responsive, tablet-friendly application shell.
- Initial GeoStake landing screen.
- Vitest and React Testing Library test infrastructure.
- ESLint and Prettier configuration.
- Docker multi-stage production build.
- Taskfile with development, testing, type-checking, linting, formatting, build, cleanup, and Docker tasks.
- Initial `.gitignore`, `.dockerignore`, and `.env.example`.
- Initial project README.
- Initial development and project conventions documented in `AGENTS.md`.

[0.0.0]: https://github.com/barbosaMatheus/geostake
