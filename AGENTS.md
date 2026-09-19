# GeoStake — Agent Development Guide

## Project Overview

GeoStake is a browser-based geography puzzle game designed primarily for tablet play.

The core gameplay revolves around identifying a mystery country from progressively more revealing clues while managing a limited supply of in-game currency and lives.

The player uses **geodes** as the game's currency.

The central gameplay tension is:

> How much information are you willing to buy before making your guess?

Players begin with a limited number of geodes and lives. Each mystery country provides a starting clue. Additional clues can be purchased with geodes, with more revealing clues costing more. Incorrect guesses consume lives. Correct guesses award geodes, with larger rewards for solving a country using fewer purchased clues.

The game is intended to work completely offline after the application has initially been loaded/installed. It must not depend on a backend API or an internet connection during gameplay.

The application will eventually be deployed as a Progressive Web App (PWA) through GitHub Pages.

---

# Technology Stack

The project uses:

* **Vite**
* **React**
* **TypeScript**
* **PWA support**
* **Vitest** for unit testing
* **React Testing Library** for testing React components where appropriate
* **ESLint** for linting
* **Prettier** where useful for consistent formatting
* **Docker** for reproducible production/containerized serving
* **GitHub Actions** for automated builds/deployment
* **GitHub Pages** for public hosting
* **Local JSON/static assets** for country data
* **localStorage** for client-side persistence when appropriate

There is intentionally **no backend**.

The production application should ultimately consist of a static Vite build served from a single container or static hosting environment.

Do not introduce a backend, database server, API server, or other infrastructure unless explicitly requested.

---

# Core Architectural Principles

## 1. Keep the Application Offline-First

GeoStake must be capable of functioning without network access during gameplay.

Do not introduce runtime dependencies on:

* REST APIs
* GraphQL APIs
* Remote databases
* CDN-hosted JavaScript
* CDN-hosted CSS
* Remote country data
* Remote flags
* Remote map/outline assets
* Third-party services required for gameplay

All gameplay data and assets should eventually be included in the application bundle or cached by the PWA service worker.

If an external data source is used during development, ingestion or preprocessing should happen during development/build time rather than at runtime.

The finished application should be testable by:

1. Opening the application while online.
2. Installing/loading it.
3. Disconnecting from the internet or enabling airplane mode.
4. Reopening the application.
5. Playing normally without network access.

---

# React Development Guidelines

## 2. Prefer Small, Focused Components

React components should have a single clear responsibility.

Avoid large components that simultaneously:

* Manage game state
* Calculate rewards
* Manipulate persistence
* Render large sections of UI
* Perform data transformation
* Handle unrelated user interactions

Prefer extracting responsibilities into:

* Components
* Custom hooks
* Pure functions
* Domain/game logic modules
* Data-access utilities
* Persistence utilities

The goal is for most application behavior to be testable without rendering the entire application.

For example, game calculations should preferably be implemented as pure functions rather than embedded directly inside JSX event handlers.

Prefer:

```ts
const reward = calculateGuessReward(gameState);
```

over putting substantial business logic directly inside:

```tsx
onClick={() => {
  // many lines of game logic
}}
```

---

## 3. Favor Pure Functions for Game Logic

Important game rules should be implemented as deterministic, independently testable functions.

Examples include:

* Selecting a mystery country
* Determining whether a guess is correct
* Calculating clue costs
* Calculating rewards
* Calculating life-purchase costs
* Applying a life loss
* Applying geode rewards
* Determining whether a player can afford an action
* Determining available clues
* Calculating score or streak values

Pure functions should generally:

* Accept explicit inputs
* Return explicit outputs
* Avoid hidden global state
* Avoid direct DOM manipulation
* Avoid directly accessing localStorage
* Avoid depending on React state

This makes the game's rules easy to test and reason about.

---

# TypeScript Guidelines

## 4. Use Strong Types

TypeScript should be used throughout the application.

Avoid `any` whenever reasonably possible.

Prefer:

* Interfaces
* Type aliases
* Discriminated unions
* String literal unions
* Generics
* Typed function parameters
* Typed return values
* Narrowing
* Type guards

For example:

```ts
type ClueTier = 1 | 2 | 3 | 4;
```

is preferable to:

```ts
type ClueTier = number;
```

when only four tiers are valid.

Similarly, prefer explicit domain types such as:

```ts
interface Country {
  id: string;
  name: string;
  capital: string;
}
```

rather than passing around anonymous objects.

If an external library or browser API requires an unusual type, prefer correctly typing or narrowing the value rather than falling back to `any`.

Use `unknown` when the type genuinely cannot be known in advance and narrow it safely.

---

# Domain Modeling

## 5. Keep Game Concepts Explicit

Important game concepts should have explicit types.

Examples include:

* `Country`
* `Clue`
* `ClueTier`
* `GameState`
* `PlayerState`
* `GuessResult`
* `GameSettings`
* `GameStatistics`
* `GeodeAmount`
* `LifeCount`

Avoid representing important domain concepts as arbitrary strings or numbers throughout the application.

If a value has business rules associated with it, consider creating a dedicated type or domain abstraction.

---

# Testing

## 6. Write Testable Code

Code should be intentionally structured so that the majority of important behavior can be unit tested.

Do not optimize exclusively for "making the UI work."

When implementing a feature, consider:

> What is the smallest unit of behavior that can be tested independently?

Prefer testing:

* Pure game logic
* Data transformations
* Validation
* Persistence helpers
* Custom hooks
* Important UI interactions
* Important component states

Avoid testing implementation details that make tests unnecessarily fragile.

---

## 7. Add Tests After New Features

When implementing a new feature, create unit tests when practical after the feature has been implemented.

New business logic should normally have corresponding tests.

Examples:

* New reward calculation → test reward calculation
* New clue tier → test clue availability and cost
* New persistence behavior → test saving/loading
* New game-state transition → test state transition
* New user interaction → test the important resulting behavior

Not every trivial visual change requires a test.

Tests should provide meaningful protection against regressions rather than simply increasing coverage numbers.

---

## 8. Use Modern React Testing Practices

Use **Vitest** for unit tests and **React Testing Library** for React component behavior where appropriate.

Prefer testing components from the perspective of a user:

* What is displayed?
* What can the user click?
* What happens after clicking?
* What changes when state changes?

Avoid relying heavily on implementation details such as:

* Internal React state
* Component instance internals
* Exact implementation structure
* Private helper methods

Do not introduce `react-test-renderer`.

---

# State Management

## 9. Keep State Local Unless It Truly Needs to Be Shared

Do not introduce a state-management library unless the application's complexity genuinely requires one.

Prefer:

1. Local React state for local UI state.
2. Custom hooks for reusable stateful behavior.
3. A small shared state solution only when multiple unrelated parts of the application genuinely need the same state.

Do not add Redux, Zustand, or another state-management library simply because it is popular.

Keep the architecture simple until complexity demonstrates a need for additional infrastructure.

## 9.1 Screen Navigation Is Plain View State

The application has no router. Screen-to-screen navigation is a single `AppView` state (`'landing' | 'game' | 'settings'`) owned by `App` (`src/navigation/views.ts` is the single source of the view union — do not scatter string literals for views through components).

Conventions:

* Create one screen component per view in `src/components` (`LandingScreen`, `GameScreen`, `SettingsScreen`). `App` switches on the `AppView` union and passes typed callbacks (`onNewGame`, `onSettings`, `onBack`, `onExit`) rather than raw setters.
* `GameScreen` accepts an optional `onExit` callback and passes it to `StatusBar` as `onHome`, which renders a subtle **Home** button inside the Geodes status column (there is no separate header navigation bar on the game screen). Never let navigation state live inside `useGame` or game logic.
* The landing screen's **Continue Game** button is enabled only when a valid saved game exists (`hasSavedGame` prop computed by `App` from the persistence layer, never by the screen itself). Reaching the landing screen always rechecks the save so the button reflects the latest game.
* Do not introduce React Router (or a similar dependency) unless the app genuinely needs URL-based routing; view state is sufficient for the current scope.

---

# Data Engineering

## 10. Treat Country Data as a First-Class Part of the Project

Country information will be assembled from multiple datasets.

The project should establish a clean, normalized internal representation rather than allowing individual components to depend directly on raw source data.

External datasets should be treated as **source data**, not as the application's domain model.

Prefer a pipeline conceptually similar to:

```text
External Sources
      ↓
Raw Data
      ↓
Normalization / Validation
      ↓
Canonical GeoStake Country Data
      ↓
Application
```

The application should consume a consistent internal country representation.

Country IDs/codes should be stable and consistently used to associate:

* Country metadata
* Flags
* Country outlines
* Capitals
* Languages
* Currencies
* Population
* Area
* Other future facts

Data normalization should happen outside UI components.

If source data has inconsistencies, aliases, missing values, different country codes, or different naming conventions, resolve those during data preparation rather than throughout the React application.

### 10.1 FactsBook Country Data Pipeline

GeoStake's canonical country dataset is generated from the locally cloned [factbook.json](https://github.com/factbook/factbook.json) repository (CIA World Factbook, public domain), not from an API or a runtime network request.

The generation pipeline is:

```text
FactsBook JSON → parser/normalizer (src/data/countries/normalization.ts)
              → required-field validation
              → canonical Country[] (src/data/countries/countries.json)
              → React application
```

Conventions:

* Normalization lives in `src/data/countries/normalization.ts` as pure, independently testable functions. Do not embed FactsBook paths or parsing rules in React components.
* The canonical dataset is a static generated artifact at `src/data/countries/countries.json`, committed to the repository and imported directly by the application.
* Regenerate it with `npm run generate:countries` (script: `scripts/generateCountries.ts`). The script is deterministic. It reads the local FactsBook checkout, skipping the `world`, `meta`, and `oceans` directories.
* Only records with every required field (`name`, `population`, `landAreaKm2`, `region`, `hemisphere`, `populationDensity`, `capital`) are retained. Optional fields do not cause exclusion.
* Excluded records are logged to `src/data/countries/EXCLUDED.md` with the source file and the invalid/missing field(s).
* The `flag` and `outline` country fields store future asset identifiers (`assets/flags/<ID>.svg`, `assets/outlines/<ID>.svg`); the assets are added in a later phase.
* The `startingClue` is generated deterministically from a randomly selected fact (population, land area, hemisphere, or region) and must never name the country.
* FactsBook HTML entities must be decoded without general-purpose sanitization. The decoder lives in `normalization.ts`; keep it in sync with the entity set actually present in the source.
* Raw FactsBook samples used by tests are copied into `src/data/countries/fixtures/`. Generated and copied data files under `src/data/countries/` are exempt from Prettier formatting (see `.prettierignore`).

---

# Static Assets

## 11. Keep Gameplay Assets Local

Flags, country outlines, icons, and other gameplay assets should ultimately be bundled with the application.

Do not reference remote assets at runtime.

Assets should use stable country identifiers wherever possible.

For example:

```text
assets/
  flags/
    US.svg
    CA.svg
    JP.svg

  outlines/
    US.svg
    CA.svg
    JP.svg
```

The exact organization may change as the project develops, but country asset lookup should remain deterministic.

---

# PWA Guidelines

## 12. Design for PWA Compatibility

The application is developed as a PWA rather than retrofitted into one at the very end.

The PWA provides:

* Web app manifest
* Appropriate application icons
* Service worker
* Offline caching
* Local/static asset caching
* Installability
* Offline application startup

Use a maintained Vite-compatible PWA solution rather than implementing a service worker manually unless there is a specific reason to do so. GeoStake uses **`vite-plugin-pwa`** (generateSW strategy), configured in `vite.config.ts`:

* `registerType: 'autoUpdate'` — the generated service worker calls `skipWaiting`/`clientsClaim` and registration is injected automatically into the built HTML (`dist/registerSW.js`), so no runtime PWA client code is imported into the app bundle.
* `manifest` — app name/short name `GeoStake`, `display: 'standalone'`, theme color `#2f6db5`, background color `#f6f3ea`, and the shared PWA icons from `public/icons/` (192×192 `any`, 512×512 `any`, 512×512 `maskable`). The `theme_color` meta and the `/favicon.svg` + `apple-touch-icon` links in `index.html` must stay in sync with the manifest colours and assets. Do **not** hard-code the manifest `start_url`/`scope`: `vite-plugin-pwa` derives them from Vite's `base`, so they stay correct when the app is served from a subpath (`/geostake/` on GitHub Pages).
* `workbox.globPatterns` — precaches the whole static build (`js/css/html/json/svg/png/ico/woff/woff2/ttf/avif/webp`) plus a `navigateFallback` that is prefixed with the base (`${APP_BASE}index.html`, i.e. `/index.html` at root and `/geostake/index.html` on Pages) and `cleanupOutdatedCaches`. All gameplay assets (country data, flags, outlines) are bundled into the JS by the bundler, so they are covered by the single app-bundle precache entry; there are no runtime network calls and no `runtimeCaching` entries that depend on the network.

The service worker configuration must ensure that all assets required for gameplay can be available offline.

Pay particular attention to:

* JSON data
* SVG flags
* SVG outlines
* JavaScript chunks
* CSS
* fonts, if any
* application icons

Avoid unnecessarily caching external network resources.

PWA asset conventions:

* `index.html` must reference the favicon at `/favicon.svg`, declare the app-icon PNGs (`/icons/geostake-192.png`, `/icons/geostake-512.png`) as `image/png` favicon candidates, and link a 192×192 `apple-touch-icon` for mobile home-screens.
* The manifest icons are **loosely coupled** placeholders shipped in `public/icons/` (`geostake-192.png`, `geostake-512.png`) plus `public/favicon.svg`; they can be swapped for the final GeoStake logo without touching the manifest structure. Lookup is by filename only. Keep all public web assets world-readable (mode `0644`) so the unprivileged nginx container can serve them.
* Service workers require a secure context (HTTPS or `localhost`); a plain static build served over unsecured HTTP in the network will not register the worker.
* Vite's `base` is derived from the `VITE_BASE_PATH` environment variable (default `/`) via `loadEnv` in `vite.config.ts`. Local dev, `vite preview`, and the Docker/nginx container use `/`; the GitHub Pages workflow builds with `VITE_BASE_PATH=/geostake/` so the app is served from the repository subpath. Do not scatter absolute URLs in game code — use `import.meta.env.BASE_URL` when a public asset path is needed.
* PWA/offline validation is documented in `README.md` under "Playing GeoStake Offline" (build, preview, service-worker/manifest/cache checks, offline reload).

Automated PWA checks live in `src/tests/pwaAssets.test.ts`:

* The required PWA assets exist with the right formats/dimensions (`icons/geostake-192.png`, `icons/geostake-512.png`, `favicon.svg`).
* `index.html` keeps the favicon, apple-touch-icon, and theme-color markup.
* `vite.config.ts` keeps the PWA plugin and key manifest/navigateFallback settings, and derives `start_url`/`scope`/`navigateFallback` from the `VITE_BASE_PATH` base instead of hard-coding them to the site root.

Do not introduce runtime PWA client dependencies (workbox-window only in the built output when registration is auto-injected) or fetch-on-demand offline behavior.

The PWA should never make network availability a requirement for starting or playing a game.

---

# Vite Guidelines

## 13. Follow Vite Conventions

Use Vite's standard project structure and configuration unless there is a specific reason to deviate.

Keep Vite configuration focused on build/dev concerns.

Do not put application/game logic into `vite.config.ts`.

Remember that Vite's `VITE_*` environment variables are exposed to client-side code and therefore are **not secrets**.

Never place:

* Passwords
* API keys
* Tokens
* Private credentials
* Secrets

in `VITE_*` variables.

---

# Environment Variables

## 14. Prefer Environment Variables With Sensible Defaults

Configuration values should preferably use environment variables with safe development defaults rather than hard-coded constants.

For example:

```env
VITE_APP_NAME=GeoStake
```

with an appropriate fallback in code/configuration.

Vite exposes client environment variables through `import.meta.env`, and custom variables should be prefixed with `VITE_`.

Environment values are strings by default, so convert and validate them when a number, boolean, or other type is expected.

Create typed environment declarations where useful so that environment configuration benefits from TypeScript IntelliSense and type checking.

Do not use environment variables merely to hide ordinary game constants that are intentionally part of the application. Use them primarily for genuine configuration.

---

# Configuration

## 15. Avoid Scattered Magic Numbers

Game configuration should not be scattered throughout components.

For example, avoid:

```ts
if (geodes < 750) {
  // ...
}
```

in multiple unrelated files.

Prefer centralized configuration:

```ts
const GAME_CONFIG = {
  startingGeodes: 1000,
  startingLives: 3,
  lifeCost: 750,
};
```

The exact configuration and values will evolve as the game is balanced.

Configuration should be separated from game logic so balancing does not require modifying many unrelated files.

---

# Persistence

## 16. Use Browser Storage Carefully

The application may use `localStorage` for player persistence.

Persistence code should be isolated behind a small, typed abstraction rather than calling `localStorage` throughout the React component tree.

For example:

```text
components/
hooks/
game/
persistence/
```

The exact structure can evolve.

Persistence utilities should handle:

* Serialization
* Deserialization
* Missing data
* Invalid/corrupt data
* Version changes where appropriate
* Default state

Never assume that data retrieved from `localStorage` is valid.

Treat persisted data as untrusted external input and validate it before using it.

## 16.1 Game Persistence Conventions

GeoStake's active-game persistence lives in `src/persistence/`:

* `storage.ts` — a dependency-free `StorageAdapter` type (`getItem`/`setItem`/`removeItem`), a `localStorageAdapter` implementation that never throws (returns "no data" when storage is unavailable), and typed `readJson`/`writeJson` helpers. Components never call `localStorage` directly.
* `savedGame.ts` — the single centralized storage key (`SAVED_GAME_KEY`), the versioned `SavedGameState`/`SavedGuessResult` shapes, `serializeGameState`/`restoreGameState`, the validator `isSavedGameState`, and the `saveGame`/`loadSavedGame`/`loadResumableGame`/`clearSavedGame`/`savedGameExists` functions. Persistence is separate from core game logic (`src/game`) and from React.

Rules:

* Persist the mystery country by its stable `id`, not the full `Country` object; resolve it against the canonical dataset when restoring. Treat an unknown stored id as "no saved game".
* `isSavedGameState` must reject incompatible data: wrong `version`, non-finite/negative resources, lives beyond `maxLives`, unknown clue ids, a starting clue that is not revealed, purchased clues that are not revealed, and a correct `GuessResult` whose `countryId` does not match the mystery country.
* `saveGame` refuses to store a game over (zero lives); it clears the saved game instead, since an ended game cannot be played further. Do not persist career statistics or settings.
* Saving is triggered by meaningful state changes only. `usePersistentGame` (in `src/hooks`) wraps `useGame` and writes on game-state changes, skipping the initial write when resuming so a loaded save is never clobbered on mount.
* The active game is written after: starting a new game or turn, guessing, losing a life, revealing/purchasing a clue, buying a life, and awarding a reward.
* Tests cover round-trips, missing/malformed/incompatible data, the game-over clear, continue behavior, and the New Game replace-confirmation flow. Storage-dependent tests should use the in-memory adapter from `src/tests/memoryStorage.ts` rather than depending on shared `localStorage`.

---

# Security

## 17. Avoid Unnecessary Security Risks

Even though GeoStake is a client-side game, follow normal web security practices.

Do not:

* Use `dangerouslySetInnerHTML` unless genuinely necessary
* Inject unsanitized HTML
* Evaluate strings as JavaScript
* Store secrets in the frontend
* Trust arbitrary persisted data
* Construct unsafe URLs from untrusted input
* Introduce dependencies without considering their purpose

All user-controlled or persisted values should be treated as potentially invalid.

---

# Docker

## 18. Containerize the Application

GeoStake should be containerized.

Because this is a static single-page application with no backend, use **one container**.

Do not introduce Docker Compose unless explicitly requested.

A preferred production architecture is a multi-stage Docker build:

```text
Node build stage
      ↓
Vite production build
      ↓
Lightweight static web server
      ↓
Single container
```

The final image should contain only what is necessary to serve the production application.

Do not run the Vite development server as the production server.

The container should expose the appropriate HTTP port through configuration/environment where practical.

The Docker image should be reproducible and should not depend on files outside the project directory.

Keep `.dockerignore` up to date.

---

# GitHub Pages

## 19. Keep Static Hosting in Mind

The final application will be deployed to GitHub Pages.

The application must therefore remain compatible with static hosting.

Do not introduce assumptions that require:

* Server-side routing infrastructure
* Backend URL rewriting
* Server-side rendering
* Runtime API endpoints

When client-side routing is eventually introduced, ensure it is compatible with GitHub Pages or avoid unnecessary routing complexity.

Vite's `base` configuration must be considered because GitHub Pages project sites are commonly served from a repository subpath rather than `/`. GeoStake handles this with `VITE_BASE_PATH` (see the PWA guidelines): the Pages workflow builds with `/geostake/`, and the manifest `start_url`/`scope` and `navigateFallback` follow the base.

Deployment is handled through a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs lint, type check, and tests, builds with `VITE_BASE_PATH=/geostake/`, uploads `dist/` with `actions/upload-pages-artifact`, and publishes with `actions/deploy-pages`. Keep this workflow aligned with any build environment, base-path, or artifact changes.

---

# Accessibility

## 20. Build Accessible UI

Use semantic HTML wherever practical.

Interactive elements should use appropriate native controls.

Prefer:

```html
<button>
```

over clickable `<div>` elements.

Provide:

* Accessible labels
* Keyboard interaction
* Visible focus states
* Sufficient contrast
* Meaningful alt text for informative images
* Empty alt text for purely decorative images
* Appropriate ARIA only when native HTML is insufficient

Do not sacrifice accessibility simply because the primary target is a tablet.

---

# Responsive Design

## 21. Design for Tablet First, Not Tablet Only

The primary target is a Samsung tablet in landscape or portrait orientation.

The UI should also remain usable on:

* Desktop browsers
* Smaller tablets
* Mobile browsers

Avoid assuming a specific screen resolution.

Do not hard-code dimensions that unnecessarily prevent responsive layouts.

Prefer responsive CSS using:

* Flexbox
* CSS Grid
* Relative sizing
* `clamp()`
* Media queries
* Touch-friendly controls

Interactive controls should have sufficiently large touch targets.

---

# Performance

## 22. Keep the Application Lightweight

GeoStake should remain a relatively small static application.

Avoid adding dependencies for functionality that can reasonably be implemented with the platform or existing libraries.

Be conscious of:

* JavaScript bundle size
* Number of dependencies
* Image/SVG sizes
* Duplicate country data
* Unnecessary React re-renders
* Large libraries used for small features

Do not prematurely optimize.

Measure first when performance becomes a concern.

For country outlines and flags, prefer appropriately sized/vector assets rather than unnecessarily large raster images.

---

# Dependency Management

## 23. Add Dependencies Deliberately

Before introducing a dependency, consider:

1. Is it actually necessary?
2. Is the functionality small enough to implement ourselves?
3. Does it work well with Vite and TypeScript?
4. Does it support the browser/offline use case?
5. Does it increase the application's bundle significantly?
6. Is it actively maintained?
7. Is its license compatible with the project?
8. Does it introduce unnecessary runtime network dependencies?

Do not add libraries simply to avoid writing a few lines of straightforward code.

---

# Error Handling

## 24. Fail Gracefully

The application should handle unexpected conditions without completely breaking the game.

Examples include:

* Invalid persisted state
* Missing country data
* Missing assets
* Unexpected browser storage failures
* Invalid configuration
* Unsupported browser features

Errors should be handled at appropriate boundaries.

Do not silently swallow errors that make debugging difficult.

During development, preserve useful error information.

---

# Code Quality

## 25. Prefer Readable Code Over Clever Code

Code should be understandable to another developer or coding agent.

Prefer:

```ts
const affordableClues = clues.filter(
  (clue) => clue.cost <= player.geodes,
);
```

over unnecessarily clever abstractions.

Use descriptive names.

Avoid:

* Single-letter variables except for trivial local iteration
* Deeply nested conditionals
* Huge functions
* Huge React components
* Unnecessary abstractions
* Clever type tricks that obscure the intent

Comments should explain **why**, not simply restate **what** the code does.

---

# Documentation

## 26. Keep AGENTS.md Up to Date

Agents should update `AGENTS.md` when the project's architecture, development practices, important conventions, or operational requirements materially change.

Do not rewrite this document unnecessarily.

Add new rules when a recurring development lesson or architectural decision becomes important enough to preserve for future agents.

Remove or update outdated instructions when the project evolves.

This document should remain an accurate source of truth for development practices.

---

## 27. Keep README.md Up to Date

Agents should update `README.md` as the project develops.

The README should eventually contain useful information such as:

* What GeoStake is
* How to install dependencies
* How to run locally
* How to run tests
* How to run linting/type checking
* How to build
* How to run the Docker container
* How to build/run the production container
* How deployment works
* How offline/PWA behavior works
* Data-source/license information
* Any important development notes

Do not allow the README to describe an outdated application.

---

## 27.1 Changelog and Semantic Versioning

This project follows **Semantic Versioning (SemVer)** and maintains a `CHANGELOG.md`.

Agents MUST treat versioning and changelog maintenance as part of normal development.

### Version Format

Use:

```text
MAJOR.MINOR.PATCH
```

Determine the appropriate version bump based on the overall impact of the changes:

* **PATCH** — Backward-compatible bug fixes, corrections, or small internal improvements that do not add new user-facing functionality.
* **MINOR** — New backward-compatible functionality, features, UI capabilities, or meaningful enhancements.
* **MAJOR** — Breaking changes, removal of existing functionality, incompatible changes to established behavior, or changes that require users to significantly change how they use the application.

When multiple types of changes are included, use the highest applicable version bump. For example, a feature plus a bug fix is a **MINOR** release; a breaking change plus new features is a **MAJOR** release.

During the project's `0.x.x` development period, continue to apply these rules intelligently. Do not use the pre-1.0 status as an excuse to arbitrarily change versions.

### Version Updates

When a change warrants a version bump:

1. Determine whether the change is PATCH, MINOR, or MAJOR.
2. Update the project's application version in the appropriate project file(s).
3. Keep all version references consistent where the project maintains more than one version source.
4. Do not manually change dependency versions unless required by the task.
5. Do not bump the version for changes that do not meaningfully alter the application, such as purely internal agent/tooling work, unless the project already treats those changes as releases.

For this React/Vite application, prefer the project's existing version source rather than introducing a second source of truth. If the application version is represented in `package.json` and surfaced through React code, keep those values synchronized.

### CHANGELOG.md

Update `CHANGELOG.md` whenever a change represents a meaningful project release or user-visible change.

Use a human-readable, chronologically ordered changelog with the newest version first.

Group changes under appropriate categories such as:

* Added
* Changed
* Fixed
* Removed
* Deprecated

Keep entries concise and focused on what changed from the user's perspective.

Do not add meaningless entries for every individual file modification.

When releasing a new version:

1. Add the new version to `CHANGELOG.md`.
2. Include the release date.
3. Summarize the notable changes under the appropriate categories.
4. Ensure the changelog version matches the application version.
5. Ensure the version bump accurately reflects the changes.

### Agent Responsibility

Before considering a feature or bug-fix task complete, agents should ask:

* Did this change warrant a version bump?
* If so, is the bump PATCH, MINOR, or MAJOR?
* Does `CHANGELOG.md` need an entry?
* Are all project version references consistent?

Agents should use judgment rather than blindly bumping the version for every commit or task.

---

# Source and Licensing Requirements

## 28. Preserve Data Attribution and Licensing Information

External datasets and assets must have their licensing requirements documented.

When importing country information, flags, outlines, icons, fonts, or other third-party material:

* Record the source.
* Record the license.
* Preserve required attribution.
* Do not assume that publicly available data is automatically unrestricted.
* Prefer permissively licensed or public-domain sources.
* Keep source/license documentation in the repository where appropriate.

Do not remove attribution simply because it is inconvenient.

---

# Git Practices

## 29. Keep Changes Focused

Each feature should ideally represent a coherent change.

Avoid mixing unrelated refactors into feature work unless the refactor is necessary.

When making a feature change:

1. Understand the existing architecture.
2. Make the smallest reasonable change.
3. Add/update tests.
4. Run validation.
5. Update documentation when appropriate.
6. Review for unnecessary complexity.

Do not rewrite functioning code merely to use a preferred personal style.

---

# Validation Requirements

## 30. Validate Before Declaring a Feature Complete

After implementing a meaningful feature, agents should run the applicable checks.

At minimum, consider:

* TypeScript type checking
* Unit tests
* Linting
* Production build

When relevant, also test:

* Docker build
* Docker runtime
* PWA installation
* Offline behavior

Do not claim a feature is complete if the application does not build.

If a check cannot be run, state that clearly.

---

# Incremental Development

## 31. Preserve a Working Application

Every development iteration should ideally leave the application in a runnable state.

Prefer small, incremental changes.

Do not implement large amounts of speculative functionality simply because it may be useful later.

When adding a feature, prioritize:

1. Working behavior
2. Appropriate tests
3. Clean architecture
4. Documentation
5. Polish

Avoid building infrastructure for hypothetical future requirements.

---

# Game Design Principles

## 32. Preserve the Core Risk/Reward Loop

When implementing new gameplay systems, maintain the central identity of GeoStake:

> Information has a price, and knowledge must be balanced against risk.

The important resources are:

* **Geodes** — the player's currency
* **Lives** — the player's mistake budget
* **Clues** — information the player can purchase
* **Guesses** — decisions that can win or cost a life

New mechanics should complement this loop rather than obscure it.

---

## 33. Keep Game Rules Centralized

Do not duplicate game rules across multiple components.

For example, the cost of a clue should have one authoritative source.

If a game rule changes, an agent should be able to modify it in one logical location rather than searching through multiple UI components.

---

# UX Principles

## 34. Make Decisions Clear

The player should always understand:

* How many geodes they have
* How many lives remain
* What clue is currently available
* How much a new clue costs
* What they gain from a correct guess
* What they lose from an incorrect guess
* What actions are currently affordable
* What happens after selecting an action

Do not hide important economic consequences behind ambiguous UI.

---

## 35. Avoid Accidental Purchases

Because geodes are a meaningful game resource, purchasing clues or lives should be deliberate.

Buttons that spend geodes should clearly communicate their cost.

Disabled states should be used when an action cannot be afforded.

---

# Future-Proofing

## 36. Do Not Over-Engineer

The project should remain simple unless real requirements justify additional architecture.

Do not introduce:

* A backend
* A database
* Redux
* Microservices
* Complex dependency injection
* Server-side rendering
* Authentication
* User accounts

unless the project requirements explicitly change.

The intended architecture is a client-side game that can be built, installed, played offline, and hosted as static content.

---

# Clue System

## 37. Keep Clues Data-Driven and Centrally Configured

Clue rules are domain logic, distinct from both the country dataset and the React UI.

The clue system uses **numeric tiers** (`0` Free, `1` Low, `2` Medium, `3` High, `4` Very High). Tiers are intentionally open-ended numbers so tiers `5`, `6`, etc. can be added later without restructuring the system.

The authoritative source of truth is `src/game/clueConfig.ts`:

* `CLUES` — the data-driven list of `ClueDefinition` entries. Each entry owns its `id`, `tier`, `baseCost`, display `label`, and the pure functions `isAvailable`, `getValue`, and `formatValue`.
* `CLUE_COST_MULTIPLIER` — the current cost multiplier, defaulting to `5` (the future "normal" difficulty). A clue's current cost is `baseCost × CLUE_COST_MULTIPLIER`. Do not hard-code clue costs or tiers in components or game-logic files.

Base costs are the normalized source values (0/10/20/50/75); the multiplier produces the in-game costs (0/50/100/250/375). Difficulty modes are **not** implemented; the multiplier is centralized so a future difficulty selector can change it without touching clue logic.

Gameplay rules live as pure, testable functions in `src/game/clues.ts` (availability, value extraction, formatting, costing, random tier-0 starting-clue selection with a `population` fallback, and `revealClue`). UI components and JSX event handlers must not reimplement these rules.

Turn-state conventions:

* Each turn tracks `startingClueId`, `revealedClueIds`, and `purchasedClueIds` on `GameState` (clue identifiers only; the `Country` is the source of truth for clue values).
* At the start of a turn exactly one available tier-0 clue is randomly selected and auto-revealed; population is the final fallback.
* The starting clue is the only free-tier clue offered during its turn: non-starting tier-0 clues are completely omitted from the UI and cannot be revealed (`getTurnClues` in `src/game/clues.ts` drives what the panel offers, and `revealClue` rejects tier-0 reveals that are not `startingClueId`). Every new turn re-rolls the starting clue, so an omitted free clue has a fresh chance next round.
* A clue whose optional data is missing for the current country is never purchasable.
* A revealed clue cannot be purchased again; revealing is a no-op when the clue is already revealed, unavailable, or unaffordable.
* Only a correct guess resolves a turn with a reward (`guessResult` outcome `'correct'`, including `geodesAwarded`). An incorrect guess deducts a life and leaves the turn open while lives remain: the same mystery country stays active, clue purchases remain available, and the player can guess again.
* The transient "not-quite" feedback after an incorrect guess is UI state (`lastIncorrectGuess` on `useGame`), not part of `GameState`; it is cleared by the next guess, a correct guess, or running out of lives.
* A resolved turn (one ended by a correct guess) is closed to further clue purchases: `revealClue` is a no-op while `guessResult` is set, and the UI disables the clue panel. Clue purchasing resumes when the next turn starts.
* Running out of lives (`lives === 0`) closes the turn with an `'incorrect'` `GuessResult`: the UI locks the guess input and clue panel and reveals the country ("Out of lives. The mystery country was [name]."). Starting a new game then requires explicit player confirmation and resets the game to a fresh start (`createInitialGameState`: starting geodes, starting lives, turn 1).
* `GAME_CONFIG.continueOnCorrectGuess` (default `true`) controls whether a correct guess automatically starts the next turn via `resolveGuess`. When `false`, a correct guess leaves the turn resolved on the feedback screen instead of auto-advancing. A future settings menu may surface this value.
* Starting a new turn resets the revealed/purchased clue state to the new starting clue only.

Random selection points (country choice, starting clue) accept an injectable `random: () => number` dependency for deterministic tests. Prefer the shared helpers in `src/game/random.ts` (`randomIndex`, `pickRandom`).

Visual-clue conventions:

* Two clues render visuals instead of text: `country-outline` (tier 3, base cost 50) and `country-flag` (tier 4, base cost 75). Each has `kind: 'outline'` or `kind: 'flag'` on its `ClueDefinition`; text clues omit `kind` (treated as `'text'`, resolved through `getClueKind` in `clueConfig.ts`). Do not add new fields that only visual clues could need; keep every text clue unchanged.
* Visual clues reuse the same availability/purchase/reveal/economy mechanics as text clues. `isAvailable` returns `false` (never throws) when the asset cannot be resolved, so the clue shows "Unavailable for this country" and the game continues.
* All visual-asset resolution is keyed on ISO 3166-1 alpha-2 codes derived at runtime from the country's `internetCountryCode` field via `isoCodeOf` (`src/data/countries/isoCode.ts`, returning `string | null`; overrides `uk → GB`, `fr → FR`). Do not add an ISO field to the canonical dataset just to serve visual assets.
* TopoJSON-specific logic is isolated and dependency-free in `src/visual/topojson.ts` (arc decoding, ring stitching, SVG path/viewBox generation). `src/visual/outlineAtlas.ts` is the only module that imports `@rembish/iso-topojson`; flag lookup is isolated in `src/visual/flagAtlas.ts` (imports `country-flag-icons/react/3x2`). Components (`CountryOutline`, `CountryFlag`) only call these atlases; keep other TopoJSON/flag-package knowledge out of game code and UI.
* The TopoJSON and all flags are bundled into the production build (no runtime network). Outline geometry is decoded per country on demand and cached; neither atlas fetches anything.
* Never reveal the country's identity through a visual clue: rendered visuals use generic accessible labels (`"Country outline clue"`, `"Country flag clue"`), `role="img"`, and no `title`, `alt`, or visible text naming the country before it is guessed.
* Missing/resolution-order behavior is a first-class concern: lookups resolve to `null` and components render nothing rather than crashing; tests must cover missing-flag and missing-outline handling.

---

## 38. Economy, Rewards, and Life Purchases

The geode economy is domain logic, centralized and testable, distinct from both the country dataset and the React UI.

The authoritative source of truth is `src/game/economyConfig.ts` (`EconomyConfig` + `ECONOMY_CONFIG`):

* `startingGeodes` (1000) and `startingLives` (3) — the resources a new game begins with.
* `baseReward` (500) — the full reward for a correct guess bought with no clues.
* `baseClueDeduction` (10) — geodes subtracted per unit of clue-tier weight.
* `minimumReward` (200) — the floor below which a reward can never drop.
* `lifeCost` (750) — the geodes a life costs to buy.
* `maxLives` (99) — the maximum lives a player can hold.

Do not hard-code economy numbers in components, hooks, or game-logic files.

Economy calculations are pure, testable functions in `src/game/economy.ts`: `countPurchasedCluesByTier`, `calculateRewardDeduction`, `calculateGuessReward`, `applyGeodeReward`, `canPurchaseLife`, and `purchaseLife`. UI components and JSX event handlers must not reimplement these rules.

Reward rules:

* The reward for solving a turn is `reward = baseReward − (baseClueDeduction × Σ(tier × count))`, where `count` is the number of purchased clues in that tier. The result is clamped to `minimumReward`, so a reward can never go below the configured floor (or become negative).
* The starting tier-0 clue is auto-revealed and never counts as purchased; free-tier clues contribute zero weight. Because the penalty weight is simply the tier number, future tiers (5, 6, ...) are rewarded automatically without restructuring.
* `revealClue` records every paid reveal in both `revealedClueIds` and `purchasedClueIds`; the reward is computed only from `purchasedClueIds`. The tier-0 starting clue appears in `revealedClueIds` but never in `purchasedClueIds`.
* A correct guess awards the computed reward and records `geodesAwarded` on the correct `GuessResult`. An incorrect guess awards nothing and deducts a life.

State split:

* `GameState` separates player state (`player.geodes`, `player.lives` — carried across turns) from turn state (`mysteryCountry`, `startingClueId`, `revealedClueIds`, `purchasedClueIds`, `guessResult` — reset each turn).
* After a correctly solved turn, `startNextTurn` resets only the turn state and selects a new country, preserving the player's geodes and lives across turns. When the previous turn was lost to zero lives, `startNextTurn` instead resets the entire game to a fresh start (starting geodes, starting lives, turn 1), always behind an explicit player confirmation in the UI.

Life purchases:

* Buying a life is an explicit player action (`purchaseLife` on `useGame`, wired to the "Buy Life" control in `StatusBar`). It costs `lifeCost` geodes and adds one life, never producing negative geodes, and never exceeding `maxLives`.
* A life purchase is unavailable (disabled) when the player lacks geodes, is already at `maxLives`, or the current turn is resolved (guessed or out of lives).

Debug Skip (temporary):

* **Skip** is a temporary development convenience, not a real game rule. It is rendered as a button in the Turn status column and implemented as the pure `skipTurn(state, countries, random)` function in `src/game/game.ts` plus a `skipTurn` action on `useGame`. Do not expand it into a purchasable or rewarded game system.
* `skipTurn` always advances to a brand-new turn: it increments `turn`, selects a fresh mystery country and starting clue, resets `guessResult`, `revealedClueIds`, and `purchasedClueIds`, and — unlike `startNextTurn` — never spends geodes, deducts a life, or awards a reward. It works regardless of the current clue/guess state, geodes, or lives (including a resolved turn or zero lives). Persistence flows through the existing `usePersistentGame` pipeline unchanged.

---

# Agent Workflow

When beginning work on a task:

1. Read `AGENTS.md`.
2. Inspect the existing project structure.
3. Understand the current implementation before modifying it.
4. Identify existing patterns and follow them.
5. Implement the smallest coherent change.
6. Add or update tests where appropriate.
7. Run relevant validation.
8. Update `README.md` if user-facing setup, behavior, or development instructions changed.
9. Update `AGENTS.md` if a meaningful architectural/development rule changed.
10. Leave the application in a working state.

Do not ask the user to manually fix problems that can reasonably be resolved as part of the implementation.

If an architectural decision is ambiguous, choose the simplest solution consistent with this document and the existing project rather than introducing unnecessary complexity.

---

# Definition of Done

A feature should generally be considered complete when:

* The feature works as intended.
* The implementation follows the project's architectural conventions.
* Important business logic is independently testable.
* Appropriate tests have been added.
* TypeScript contains no unnecessary `any` usage.
* Relevant lint/type/test/build checks pass.
* No unnecessary runtime network dependency was introduced.
* Documentation is updated when appropriate.
* The application remains runnable.
* The change does not unnecessarily complicate future development.

The goal is not merely to make GeoStake work.

The goal is to build a small, maintainable, testable, offline-first game that can continue evolving safely over time.

