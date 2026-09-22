# Changelog

All notable changes to GeoStake are documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.13.0] - 2026-09-22

### Added

- A **Help** button (question-mark icon, `aria-label="Help"`) in the game
  screen header. It opens a dismissible overlay with short, player-focused
  instructions covering the mystery-country goal, free starting clues, clue and
  life purchases, the starting geodes/lives, lives being lost on incorrect
  guesses, running out of lives ending the game, and the upcoming skip-purchase
  feature. The overlay closes via its Close button, the Escape key, or a
  backdrop click and can be reopened at any time. Help state is transient UI
  state (never persisted; reset whenever the Game screen is left or the page
  reloads) and does not touch gameplay. Application version bumped to `0.13.0`.

[0.13.0]: https://github.com/barbosaMatheus/geostake

## [0.12.0] - 2026-09-21

### Added

- Centralized `GuessChecker` service (`src/game/guessChecker.ts`) that makes
  guesses tolerant of reasonable human variation: case differences, `&`/`and`,
  `Saint`/`St`, optional `The` and `of`, parenthetical alternative names, minor
  punctuation/whitespace differences, and accented characters are normalized
  before guesses are compared against country names. A guess is correct only
  when it satisfies both a Jaro-Winkler similarity gate
  (`USER_GUESS_MIN_PCT_MATCH`, default `0.90`) and a Damerau-Levenshtein edit
  cap (`USER_GUESS_MAX_EDIT_DISTANCE`, default `1`), so a single-letter typo
  like `Romenia` → `Romania` or `Japna` → `Japan` counts as correct while
  confusable pairs such as `Nigeria` for a `Niger` turn stay rejected.
  Single-edit confusables that no threshold can separate from tolerated typos
  (`Iran`/`Iraq`, `Ireland`/`Iceland`, `Dominica`/`The Dominican`,
  `The Gambia`/`Zambia`) are rejected unconditionally via the hard-coded
  `USER_GUESS_EXCLUDED_PAIRS` set.
  Top-level game functions (`isCorrectGuess`/`normalizeCountryName`) keep their
  existing signatures and now delegate to the checker, so guesses like
  `Bahamas`, `St Kitts & Nevis`, `Romenia`, or `Islas Malvinas` count as
  correct. Application version bumped to `0.12.0`.
- The landing screen now shows the application version (`package.json`
  `version`, e.g. "GeoStake v0.12.0") as a small footer.
- A correct guess no longer advances straight to the next turn. The feedback
  card now reports the success alongside the accepted match percentage (e.g.
  `Correct! 92% match with 'Brazil'`; exact matches show `100%`) and a
  **Start Next Turn** button, so the next round only begins when the player
  chooses to continue. The underlying `GAME_CONFIG.continueOnCorrectGuess`
  default is now `false`.

[0.12.0]: https://github.com/barbosaMatheus/geostake

## [0.11.0] - 2026-09-19

### Added

- GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) that
  builds the app and publishes it to GitHub Pages on every push to `main`.
- GitHub Pages (project-site subpath) support: the Vite `base` is now driven by
  the `VITE_BASE_PATH` environment variable (default `/`, `/geostake/` for the
  Pages deployment), and the PWA manifest `start_url`/`scope` plus the service
  worker `navigateFallback` are derived from that base instead of being
  hard-coded to the site root, so installation and offline play keep working
  when the game is served from `https://<user>.github.io/geostake/`.
- `VITE_BASE_PATH` documented in `.env.example`.
- Application version bumped to `0.11.0`.

[0.11.0]: https://github.com/barbosaMatheus/geostake

## [0.10.1] - 2026-09-13

### Changed

- The GeoStake app icon (`public/icons/geostake-192.png`) now appears next to
  the game title on both the landing screen and the game screen, using the same
  loosely coupled icon asset as the PWA manifest.
- The app-icon PNGs are now declared as browser favicon candidates in
  `index.html` (alongside the SVG favicon), so the tab/bookmark icon matches
  the installed-app icon.

[0.10.1]: https://github.com/barbosaMatheus/geostake

## [0.10.0] - 2026-09-13

### Added

- PWA support via `vite-plugin-pwa`: a web app manifest (app name `GeoStake`,
  `standalone` display, 192×192 and 512×512 icons with `any` and `maskable`
  purposes, accent/background colors matching the UI) and a service worker
  that precaches the entire application — HTML, JS, CSS, all country data
  (flags and outlines are bundled into the JS), icons, and favicon — so the
  game installs and runs fully offline after a single successful load.
- `index.html` now links the `/favicon.svg` favicon and an `apple-touch-icon`
  and declares the theme color.
- Offline-safe navigation: navigation requests fall back to the precached
  `index.html`, and the service worker auto-updates and takes control
  immediately on new deployments.
- Automated PWA asset/config checks in `src/tests/pwaAssets.test.ts`.
- README section **Playing GeoStake Offline** documenting the player workflow,
  browser limitations, and the developer offline-validation procedure.
- Application version bumped to `0.10.0`.

### Changed

- `vite.config.ts` includes the `VitePWA` plugin (generateSW strategy) and
  adds `vite-plugin-pwa` as a dev dependency.

[0.10.0]: https://github.com/barbosaMatheus/geostake

## [0.9.0] - 2026-09-13

### Added

- The game view is now laid out to better use horizontal tablet space: the
  player status bar is split into three balanced columns (Geodes, Lives,
  Turn), the clue tiers render in a two-column grid on wider screens (the free
  starting clue spans the full width), and the guess row stacks gracefully on
  narrow screens.
- **Home** is now a subtle button inside the Geodes status column, replacing
  the prominent header "Back to Landing" control.
- A temporary debug **Skip** action under the Turn column advances to a brand
  new turn immediately without spending geodes, losing a life, or awarding a
  reward. It works mid-turn and even while a resolved turn is waiting, and it
  is persisted through the normal save pipeline.
- Application version bumped to `0.9.0`.

### Changed

- `StatusBar` accepts optional `onHome` and `onSkip` handlers; Home and Skip
  render only when their handler is provided.
- `useGame` exposes a `skipTurn` action backed by the pure `skipTurn` function
  in `src/game/game.ts`.

[0.9.0]: https://github.com/barbosaMatheus/geostake

## [0.8.0] - 2026-09-13

### Added

- Local persistence for the active game via `localStorage`, so refreshing or
  reopening the app lets the player continue where they left off.
- A small typed persistence layer in `src/persistence` (`storage.ts` for the
  safe storage adapter and JSON helpers, `savedGame.ts` for the versioned
  saved-game shape, validation, and save/load/clear logic). The mystery
  country is stored by its stable id and resolved against the canonical
  dataset on load; corrupt, malformed, or incompatible stored data is safely
  treated as "no saved game".
- **Continue Game** is now enabled on the landing screen whenever a valid
  saved game exists and resumes that game when clicked.
- **New Game** asks for confirmation before replacing an existing saved game;
  cancelling leaves the save untouched.
- Saving on meaningful game-state changes (starting a game/turn, guessing,
  losing a life, purchasing/revealing a clue, buying a life, awards). The
  saved game is cleared when the game ends (out of lives).
- An in-memory storage adapter (`src/tests/memoryStorage.ts`) for
  deterministic persistence tests.
- Application version bumped to `0.8.0`.

### Changed

- `GameScreen` now runs on the persistent-game hook and accepts an optional
  `initialGameState` and `storage` for tests and continuation.

[0.8.0]: https://github.com/barbosaMatheus/geostake

## [0.7.1] - 2026-09-13

### Changed

- Removed the tagline from the game screen; it now appears only on the landing
  page. The game title remains on both pages.
- Application version bumped to `0.7.1`.

[0.7.1]: https://github.com/barbosaMatheus/geostake

## [0.7.0] - 2026-09-13

### Added

- A **landing screen** as the default application view, with GeoStake
  branding, a _New Game_ button that starts a fresh game, a _Continue Game_
  button, and a _Settings_ button.
- A **Settings** screen placeholder with a heading, a note that settings
  functionality will come later, and a _Back to Landing_ control.
- A _Back to Landing_ control on the game screen that returns to the menu
  without touching gameplay logic.
- Strongly typed view-state navigation (`AppView` in
  `src/navigation/views.ts`); no router dependency was introduced.
- Application version bumped to `0.7.0`.

### Changed

- The application now opens on the landing screen instead of dropping
  directly into the game.
- **Continue Game** is visible but disabled until persistence is implemented
  (planned for the next phase).

[0.7.0]: https://github.com/barbosaMatheus/geostake

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
