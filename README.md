# GeoStake

GeoStake is a browser-based geography puzzle game designed primarily for tablet
play. Identify a mystery country from progressively more revealing clues while
managing a limited supply of **geodes** (currency) and **lives**. Clues can be
purchased for geodes; correct guesses award geodes, and incorrect guesses cost a
life. The game runs fully offline once loaded, with no backend.

> How much information are you willing to buy before making your guess?

GeoStake is currently in early development. The application opens on a
**landing screen** with a _New Game_ button (which starts a fresh game), a
_Continue Game_ button (enabled whenever a saved game exists), and a
_Settings_ button (currently a placeholder). The game itself is a single
screen showing a three-column status area (geodes, lives, turn — each with a
companion action), a mystery country, a tiered clue area, a country-name guess
input, guess feedback, a reward for correctly solving a turn, and a way to
start the next turn. On wider screens the clue tiers render in a two-column
grid to use horizontal tablet space. A subtle _Home_ button returns to the menu
at any time, and a debug _Skip_ button advances to the next turn for free. The
current game is saved locally, so
refreshing or reopening the app lets you continue where you left off. The
application is powered by a canonical country dataset generated from the
public-domain CIA World Factbook. Clues are revealed automatically and
purchased with geodes according to a centralized cost multiplier, and correct
guesses award geodes according to a tier-weighted reward system, including two
visual clues that render the mystery country's outline and flag from locally
bundled data. Difficulty modes, reconfigurable settings, and PWA support are
not implemented yet.

## App Structure and Navigation

The application uses simple, strongly typed view state rather than a router.
There are three views, each a small focused component:

| View             | Description                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `LandingScreen`  | Default view. GeoStake branding, **New Game**, **Continue Game** (enabled when a save exists), **Settings**.                    |
| `GameScreen`     | The full gameplay screen. Status columns for geodes (with **Home**), lives (with **Buy Life**), and turn (with debug **Skip**). |
| `SettingsScreen` | Placeholder page with a _Back to Landing_ control.                                                                              |

`App` owns a single `AppView` state (`'landing' | 'game' | 'settings'`,
defined in `src/navigation/views.ts`) starting at `'landing'` and switches
between views without a router. Game logic is untouched by navigation and
remains in `src/game`, `src/hooks`, and the individual screen components.

## Game Persistence

The active game is saved to `localStorage` under a single versioned key
(`geostake:saved-game`) so the player can continue after a refresh or app
restart. Saving happens through a small typed persistence layer in
`src/persistence` rather than touching `localStorage` from components:

- `storage.ts` — a thin `StorageAdapter` (with a `localStorage` implementation)
  plus safe typed JSON `readJson`/`writeJson` helpers that degrade to "no data"
  on missing or malformed values.
- `savedGame.ts` — the saved-game shape, serialization/restoration, and
  validation. The mystery country is stored by its stable country `id` and
  resolved against the canonical dataset on load, so outdated or unknown ids
  are treated as "no saved game".

A save is written whenever meaningful game state changes: starting a new game
or turn, guessing, losing a life, revealing/purchasing a clue, buying a life,
or receiving a reward. Rendering or unrelated UI state never triggers a write.
The save is removed when the current game ends (out of lives), since a game
with zero lives cannot be played further; starting a fresh game then works
without confirmation. When a save already exists, the landing screen's
**Continue Game** resumes it, and **New Game** asks for confirmation before
replacing it. No statistics, settings, or account data are persisted.

## Clue System

Clues are grouped into five numeric tiers. One free tier-0 clue is randomly
selected and revealed at the start of every turn; that starting clue is the
only free-tier clue offered for the turn, and the other free-tier clues are
omitted until a later turn gives them another random chance. Every other clue
must be purchased with geodes, and clues whose data is missing for the current
country cannot be purchased.

| Tier | Name      | Clues                                                       | Base Cost |
| ---- | --------- | ----------------------------------------------------------- | --------: |
| 0    | Free      | Population, Land Area, Population Density, Lowest Elevation |         0 |
| 1    | Low       | Region, Hemisphere                                          |        10 |
| 2    | Medium    | Coastline, Highest Elevation                                |        20 |
| 3    | High      | Capital, National Colors, Country Outline                   |        50 |
| 4    | Very High | Internet Country Code, Country Flag                         |        75 |

The current cost of a clue is its base cost times the centralized
`CLUE_COST_MULTIPLIER` (default `5`, the normal-difficulty multiplier), so the
in-game costs are currently 0 / 50 / 100 / 250 / 375 geodes. The multiplier
lives in `src/game/clueConfig.ts` and is designed to make future difficulty
modes change only that value. Clue tiers and definitions are data-driven, so
additional tiers (5, 6, ...) and clues can be added without restructuring the
system. Clue rules live in pure, unit-tested functions in `src/game/clues.ts`.

Two clues are **visual** instead of text: the Country Outline (tier 3) draws
the mystery country's silhouette and the Country Flag (tier 4) shows its flag.
When revealed, both render the asset directly in the clue panel with a generic
accessible label ("Country outline clue" / "Country flag clue") so the
country's name is never disclosed before the player guesses it. See
[Visual Clue Assets](#visual-clue-assets) below.

## Visual Clue Assets

GeoStake resolves both visual clues from a country's ISO 3166-1 alpha-2 code.
The canonical dataset keys countries on FactsBook GEC codes rather than ISO
codes, so the ISO value is derived deterministically at runtime from each
country's `internetCountryCode` field in `src/data/countries/isoCode.ts`
(with two documented overrides: `.uk` → `GB` and France → `FR`).

- **Flags** come from `country-flag-icons` (MIT). The React components are
  imported as a namespace in `src/visual/flagAtlas.ts` and bundled with the
  application, so every flag renders locally with no network access.
- **Outlines** come from `@rembish/iso-topojson` (CC BY 4.0, derived from
  public-domain Natural Earth 10m data). The TopoJSON is imported as a static
  JSON module and bundled. Only the current mystery country's geometry is
  decoded, on demand and cached, into an SVG path at runtime
  (`src/visual/outlineAtlas.ts`). The decoding logic itself lives in the
  dependency-free `src/visual/topojson.ts`, isolating TopoJSON specifics so the
  underlying dataset can be swapped later without touching game code. Geometry
  is projected into its own `viewBox`, so each outline keeps its true shape
  and aspect ratio while scaling to fit the clue panel.
- When an asset cannot be resolved (no ISO code, an unknown code, or a missing
  flag/geometry), the visual clue is simply marked **Unavailable for this
  country**; the clue cannot be purchased, and the rest of the game continues
  normally.

Both datasets are part of the production bundle (the flags, the world
outline geometry, and application code ship together in the single offline
JavaScript build), so visual clues work with the network disconnected.

## Game Configuration

Game rules that are not clue data or economy values live in `src/game/config.ts`
under `GAME_CONFIG`:

| Setting                  | Default | Description                                                                                                                                                                            |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `continueOnCorrectGuess` | `true`  | When enabled, a correct guess immediately starts the next turn. When disabled, the turn stays open on the feedback screen and clue purchases are disabled until the next round starts. |

`GAME_CONFIG` also carries a reference to `ECONOMY_CONFIG`
(`src/game/economyConfig.ts`), which holds the player-economy numbers described
below.

This is centralized configuration, not yet user-configurable in the UI; a
settings menu is planned for a later phase.

## Economy and Rewards

The geode economy is centralized in `src/game/economyConfig.ts` under
`ECONOMY_CONFIG`:

| Setting             | Default | Description                                              |
| ------------------- | ------- | -------------------------------------------------------- |
| `startingGeodes`    | `1000`  | Geodes the player begins a game with.                    |
| `startingLives`     | `3`     | Lives the player begins a game with.                     |
| `baseReward`        | `500`   | Geodes awarded for a correct guess bought with no clues. |
| `baseClueDeduction` | `10`    | Geodes subtracted per unit of clue-tier weight.          |
| `minimumReward`     | `200`   | The floor below which a guess reward can never drop.     |
| `lifeCost`          | `750`   | Geodes required to buy one life.                         |
| `maxLives`          | `99`    | The maximum number of lives a player can hold.           |

The reward for solving a turn is:

```text
reward = baseReward − (baseClueDeduction × Σ(tier × count of purchased clues in that tier))
```

The starting free tier-0 clue is revealed automatically and never counts as
purchased. Each purchased clue adds its tier number to the penalty weight, so
buying more revealing (higher-tier) clues shrinks the reward, which can never
fall below `minimumReward`. Because the weight is simply the tier number,
future tiers (5, 6, ...) are rewarded automatically without changes.

Gameplay state is split into player state (geodes, lives, carried across turns)
and turn state (mystery country, revealed clues, purchased clues, guess
result). Correct guesses award geodes; incorrect guesses cost one life and keep
the turn open. A correct guess ends the turn. Running out of lives also ends
the turn without a reward and reveals the country; starting a new game after
that requires confirmation and resets everything — geodes, lives, and turn — to
their starting values. You can buy a life at any time during an active turn for
`lifeCost` geodes (respecting `maxLives` and never going into negative geodes).
Economy rules are pure, unit-tested functions in `src/game/economy.ts`.

## Debug Skip

While in development, a **Skip** button appears under the Turn column of the
status bar. It advances immediately to a brand-new turn — a freshly selected
mystery country and starting clue — without spending geodes, deducting a life,
or awarding any reward. It works whether the current turn is still active or
already resolved, and it is saved through the normal persistence pipeline. It
is intended as a temporary development convenience and will be removed once
real game systems (difficulty, other turn-advance mechanics) exist. The hook
action is backed by the pure `skipTurn` function in `src/game/game.ts`.

## Country Data

GeoStake ships with a static canonical country dataset at
`src/data/countries/countries.json` plus a small accessor module
(`src/data/countries/index.ts`). The React application imports this generated
dataset locally; it never talks to a backend or parses the raw FactsBook files
at runtime, so gameplay works fully offline.

### Source

The canonical dataset is generated from the
[factbook.json](https://github.com/factbook/factbook.json) repository (the CIA
World Factbook exported as JSON). The repository is cloned locally and treated
as the only source of truth; no network requests are made during generation.

### Pipeline

The mapping from raw FactsBook JSON to canonical GeoStake country data is:

```text
FactsBook JSON → parser/normalizer (src/data/countries/normalization.ts)
              → required-field validation
              → canonical Country[] (src/data/countries/countries.json)
```

Normalization is implemented as pure, independently testable functions. Only
records with all required fields (`name`, `population`, `landAreaKm2`,
`region`, `hemisphere`, `populationDensity`, `capital`) are retained. Optional
fields such as `coastlineKm`, elevation extremes, `internetCountryCode`, and
`nationalColors` are populated when the source data allows. Records that do
not produce valid data (for example territories without a capital or
population) are excluded and reported in `src/data/countries/EXCLUDED.md`.

Each country's `startingClue` is generated deterministically from a randomly
selected fact (population, land area, hemisphere, or region) and never
reveals the country's name. The `flag` and `outline` fields store asset
identifiers (`assets/flags/<ID>.svg`, `assets/outlines/<ID>.svg`) reserved for
future use; the visual clues added in Phase 5 resolve their assets from the
country's ISO code instead (see
[Visual Clue Assets](#visual-clue-assets)).

### Regenerating the dataset

```sh
npm run generate:countries
```

The script reads the FactsBook checkout, normalizes every country file (skipping
the `world`, `meta`, and `oceans` directories), and writes `countries.json` and
`EXCLUDED.md`. It is deterministic. Set `FACTBOOK_PATH` to point at a different
FactsBook checkout if it is not located at the default path.

### License and attribution

The FactsBook data is derived from the CIA World Factbook, which is a public
domain work. The `factbook.json` repository itself is released under
[CC0 1.0 Universal](https://github.com/factbook/factbook.json/blob/main/LICENSE.md).
Raw FactsBook samples used as test fixtures are stored under
`src/data/countries/fixtures/`.

## Technology Stack

- **Vite** (build tool and dev server)
- **React** 19 + **TypeScript** (strict)
- **Vitest** + **React Testing Library** for testing
- **ESLint** + **Prettier** for linting and formatting
- **Docker** (single-container, multi-stage production build)
- No backend; the application is a static build served by a lightweight web
  server.

## Prerequisites

- **Node.js** 22+ and **npm**
- **Docker** (optional, for containerized builds)
- **Task** (optional, for Taskfile commands)

## Installation

```sh
npm install
```

## Development

Start the Vite development server:

```sh
npm run dev
```

## Testing

Run the test suite once:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

## Building

Type-check, lint, then build the production bundle into `dist/`:

```sh
npm run typecheck
npm run lint
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Docker

Build the production container image:

```sh
docker build --tag geostake .
```

Start the container and serve on port `8080`:

```sh
docker run --detach --name geostake --publish 8080:8080 geostake
```

Stop and remove the container:

```sh
docker rm --force geostake
```

The final image is multi-stage: dependencies are installed and the static
bundle is built in a Node stage, then copied into a lightweight nginx
(unprivileged) image that serves it on port `8080`.

## Taskfile

If [Task](https://taskfile.dev) is installed, the following commands are
available:

| Command              | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `task version-sync`  | Sync `package.json`/`VERSION` to the highest version (runs before every task) |
| `task install`       | Install dependencies                                                          |
| `task dev`           | Start the Vite development server                                             |
| `task test`          | Run the test suite once                                                       |
| `task test:watch`    | Run the test suite in watch mode                                              |
| `task typecheck`     | Run the TypeScript type checker                                               |
| `task lint`          | Lint with ESLint                                                              |
| `task format`        | Format with Prettier                                                          |
| `task build`         | Build the production bundle                                                   |
| `task preview`       | Build and preview the production bundle                                       |
| `task data:generate` | Regenerate the canonical country dataset                                      |
| `task clean`         | Remove build artifacts                                                        |
| `task docker:build`  | Build the production container image                                          |
| `task docker:up`     | Build, start, and expose the production container                             |
| `task docker:down`   | Stop and remove the production container                                      |

## Environment

Copy `.env.example` to `.env` to override defaults. All variables are
non-secret and client-visible.

| Variable        | Default    | Description                               |
| --------------- | ---------- | ----------------------------------------- |
| `VITE_APP_NAME` | `GeoStake` | Application name shown in the page header |

## Playing GeoStake Offline

GeoStake is a Progressive Web App (PWA). Once it has been loaded online for the
first time, the service worker precaches the entire application — HTML, JS, CSS,
all country data, every flag, every country outline, the icons, and the
favicon — so the game works with no network access at all.

To play GeoStake offline:

1. Open GeoStake while online (the app loads normally and the service worker
   caches everything it needs).
2. Install / add GeoStake to the device home screen when your browser supports
   it (usually via the browser menu or a promoted install prompt).
3. Open the installed app once while online so the pre-caching completes.
4. Enable airplane mode or otherwise disable network access.
5. Reopen / reload GeoStake (from the home-screen icon, or refresh the page).
6. Verify that the landing screen, New Game, Continue Game, Settings, starting
   turns, clue purchases (including the flag and outline clues), guessing,
   lives, geodes, rewards, life purchases, the debug Skip action, and saved
   games all work normally. Progress is kept in `localStorage` on the device.
7. The first launch after the app updates will use the new version; browsers
   fetch the updated bundle in the background when a connection is available.

Browser/device limitations:

- Service workers require a secure context (HTTPS) or `localhost`. This means
  installation and offline support work on the hosted site and on `localhost`,
  but not when serving the plain build over unsecured HTTP on the network.
- Installability depends on the browser (Chrome/Edge/Android support it well;
  Safari and iOS support installing to the home screen but with a more limited
  offline install experience).
- Saved games live in the browser's `localStorage` for the site; clearing site
  data deletes saved progress.
- To start over with a fresh cache, clear the site data or unregister the
  service worker in DevTools.

### Validating the production build offline

A developer can verify offline behavior of a local production build without a
feature-phone setup:

```sh
npm run build        # produces dist/ with sw.js, workbox-*.js, manifest.webmanifest
npm run preview      # serves the production build on http://localhost:4173
```

Then in a browser opened to the preview URL:

1. Confirm the service worker is registered and active (DevTools →
   Application → Service Workers → `sw.js`, scope `/`).
2. Confirm the app manifest parses (Application → Manifest) with the app name,
   `standalone` display mode, and both 192×192 and 512×512 icons.
3. Confirm the cache storage contains the precached entries (Application →
   Cache Storage → the Workbox precache: `index.html`, the JS/CSS bundles,
   `favicon.svg`, `icons/geostake-192.png`, `icons/geostake-512.png`, and
   `manifest.webmanifest`).
4. Switch DevTools → Network → Offline (or enable airplane mode on the
   machine), reload, and play: start a game, buy a clue (including the flag and
   outline clues), guess, buy a life, use Skip, navigate to Settings and back,
   and confirm a saved game persists across reloads.

An HTTP-level sanity check can also be run against the preview server from a
terminal (every URL below must return `200`):

```sh
for p in "" manifest.webmanifest sw.js registerSW.js favicon.svg \
  icons/geostake-192.png icons/geostake-512.png \
  assets/index-*.js assets/index-*.css; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:4173/$p"
done
```

The build output remains compatible with static hosting; serving the site from
a repository subpath (GitHub Pages project site) is planned for Phase 8 and
will reuse the same `base`-relative asset handling.

## License and Attribution

The canonical country dataset is generated from the public-domain CIA World
Factbook via the `factbook.json` repository (CC0 1.0 Universal). See the
[Country Data](#country-data) section for the source and pipeline.

The visual clue assets bundle two additional local datasets:

- **Flags** — `country-flag-icons` (MIT, &copy; 2020 @catamphetamine).
- **Country outlines** — `@rembish/iso-topojson` (CC BY 4.0), derived from
  public-domain [Natural Earth 10m](https://www.naturalearthdata.com/) shape
  files. Attribution for GeoStake's use of the derived outline dataset: World
  country outlines from [rembish/iso-topojson](https://github.com/rembish/iso-topojson),
  &copy; Sebastien Rombauts, under CC BY 4.0.
