# Changelog

All notable changes to GeoStake are documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-09-12

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
