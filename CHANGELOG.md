# Changelog

All notable changes to GeoStake are documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.6.0] - 2026-09-13

### Added

- Two new visual clues: **Country Outline** (tier 3, base cost 50) and
  **Country Flag** (tier 4, base cost 75). Both reuse the existing clue
  availability, purchase, reveal, and reward mechanics and share the current
  tier costs (250 / 375 geodes at the default multiplier).
- A `kind` field on clue definitions (`'text' | 'flag' | 'outline'`, defaulting
  to `'text'`) so clues can present visual content; existing text clues are
  unchanged.
- Country flag rendering from `country-flag-icons` (bundled React components,
  resolved by ISO code) in `src/visual/flagAtlas.ts`.
- Country outline rendering from `@rembish/iso-topojson` (bundled TopoJSON,
  geometry decoded to an SVG path at runtime) in `src/visual/topojson.ts` and
  `src/visual/outlineAtlas.ts`. Only the current mystery country's geometry is
  decoded, on demand and cached, and scaled to fit the clue panel while
  preserving aspect ratio (including multi-polygon/island countries).
- Runtime ISO 3166-1 alpha-2 derivation (`src/data/countries/isoCode.ts`) from
  each country's `internetCountryCode` field, with overrides for the United
  Kingdom (`GB`) and France (`FR`).
- Fail-safe missing-asset handling: when a flag or outline cannot be resolved,
  the clue is marked unavailable and the game continues normally.
- Accessible, generic labels for the visual clues ("Country outline clue" /
  "Country flag clue") that never reveal the country's identity.
- Two new runtime dependencies (`country-flag-icons`, `@rembish/iso-topojson`);
  both datasets are bundled into the offline production build.
- Application version bumped to `0.6.0`.

[0.6.0]: https://github.com/barbosaMatheus/geostake

## [0.5.1] - 2026-09-13

### Changed

- Running out of lives now completely resets the game to the beginning after
  the player confirms: geodes, lives, and turn all return to their starting
  values instead of carrying accumulated geodes into an incremented turn.
- The game-over screen now asks for confirmation ("Confirm New Game" / "Cancel")
  before starting over.
- Application version bumped to `0.5.1`.

[0.5.1]: https://github.com/barbosaMatheus/geostake

## [0.5.0] - 2026-09-13

### Added

- Geode economy and turn rewards: a correct guess now awards geodes based on
  the clues purchased during that turn
  (`reward = baseReward − baseClueDeduction × Σ(tier × count)`), with a
  configurable `minimumReward` floor so rewards never go below a set amount or
  become negative.
- Centralized economy configuration (`src/game/economyConfig.ts`): starting
  geodes and lives, base reward, per-tier clue deduction, minimum reward, life
  purchase cost, and maximum lives.
- Purchased clues are now tracked separately from auto-revealed clues
  (`purchasedClueIds` on `GameState`); the free tier-0 starting clue never
  counts as a purchase and never reduces the reward.
- A "Buy Life" control in the status bar that costs geodes, adds one life,
  respects the maximum life count, and is disabled when unaffordable or the
  turn is resolved.
- Reward math, life purchases, and affordability checks as pure, unit-tested
  functions in `src/game/economy.ts`.
- The status bar now shows the current turn number.

### Changed

- Correct-guess feedback now reports the reward earned (for example, "You
  earned 490 geodes!").
- Running out of lives now ends the turn and reveals the mystery country
  ("Out of lives. The mystery country was [name]."), and starting the next turn
  restores lives while keeping the player's accumulated geodes instead of
  resetting the whole game.
- `startingGeodes` and `startingLives` moved from `GAME_CONFIG` into the new
  `ECONOMY_CONFIG`, which `GAME_CONFIG` now references.
- Application version bumped to `0.5.0`.

[0.5.0]: https://github.com/barbosaMatheus/geostake

## [0.4.0] - 2026-09-13

### Changed

- Only one free-tier clue is now offered per turn: the randomly selected
  starting clue, revealed at the start of the turn. The other free-tier clues
  are omitted for the turn and cannot be purchased; every new turn re-rolls the
  starting clue from all available free-tier clues, so any skipped clue can
  appear in a later round.
- `Coastline` moved from the free tier to the medium tier (now 100 geodes),
  and `Lowest Elevation` moved from the medium tier to the free tier (now part
  of the random starting-clue pool).

[0.4.0]: https://github.com/barbosaMatheus/geostake
[0.3.2]: https://github.com/barbosaMatheus/geostake

### Fixed

- An incorrect guess no longer ends the turn. The player stays on the same
  mystery country with the guess input and clue panel still active, so they can
  purchase more clues and keep guessing until they get it right.
- Running out of lives now ends the game with a distinct "Game over" state and
  a "Start New Game" action that resets geodes and lives, instead of advancing
  to the next turn with zero lives.

[0.3.2]: https://github.com/barbosaMatheus/geostake
[0.3.1]: https://github.com/barbosaMatheus/geostake

### Fixed

- After correctly guessing the mystery country, the game now automatically
  advances to the next turn instead of leaving the player on the solved puzzle
  where they could continue buying clues.
- Clue purchases are now disabled whenever a turn has been resolved (guessed)
  until the next turn begins, both in the UI and in the underlying
  `revealClue` game logic.

### Added

- Centralized `continueOnCorrectGuess` setting in `GAME_CONFIG` (default
  `true`). When enabled, a correct guess immediately starts the next turn;
  when disabled, the turn stays open on the feedback screen and clue
  purchasing remains disabled until the next round starts. A future settings
  menu can expose this value.

[0.3.1]: https://github.com/barbosaMatheus/geostake
[0.3.0]: https://github.com/barbosaMatheus/geostake

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
