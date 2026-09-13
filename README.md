# GeoStake

GeoStake is a browser-based geography puzzle game designed primarily for tablet
play. Identify a mystery country from progressively more revealing clues while
managing a limited supply of **geodes** (currency) and **lives**. Clues can be
purchased for geodes; correct guesses award geodes, and incorrect guesses cost a
life. The game runs fully offline once loaded, with no backend.

> How much information are you willing to buy before making your guess?

GeoStake is currently in early development. A playable game screen is
implemented: it shows your geodes, lives, and turn, a mystery country, a tiered
clue area, a country-name guess input, guess feedback, a reward for correctly
solving a turn, and a way to start the next turn. The application is powered by
a canonical country dataset generated from the public-domain CIA World
Factbook. Clues are revealed automatically and purchased with geodes according
to a centralized cost multiplier, and correct guesses award geodes according to
a tier-weighted reward system. Persistence, country flag/outline assets,
difficulty modes, and PWA support are not implemented yet.

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
| 3    | High      | Capital, National Colors                                    |        50 |
| 4    | Very High | Internet Country Code                                       |        75 |

The current cost of a clue is its base cost times the centralized
`CLUE_COST_MULTIPLIER` (default `5`, the normal-difficulty multiplier), so the
in-game costs are currently 0 / 50 / 100 / 250 / 375 geodes. The multiplier
lives in `src/game/clueConfig.ts` and is designed to make future difficulty
modes change only that value. Clue tiers and definitions are data-driven, so
additional tiers (5, 6, ...) and clues can be added without restructuring the
system. Clue rules live in pure, unit-tested functions in `src/game/clues.ts`.

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
the turn without a reward and reveals the country; the next turn keeps your
accumulated geodes and restores lives to `startingLives`. You can buy a life at
any time during an active turn for `lifeCost` geodes (respecting `maxLives` and
never going into negative geodes). Economy rules are pure, unit-tested
functions in `src/game/economy.ts`.

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
reveals the country's name. The `flag` and `outline` fields store future asset
identifiers (`assets/flags/<ID>.svg`, `assets/outlines/<ID>.svg`); the assets
themselves are not part of this phase.

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

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `task install`       | Install dependencies                              |
| `task dev`           | Start the Vite development server                 |
| `task test`          | Run the test suite once                           |
| `task test:watch`    | Run the test suite in watch mode                  |
| `task typecheck`     | Run the TypeScript type checker                   |
| `task lint`          | Lint with ESLint                                  |
| `task format`        | Format with Prettier                              |
| `task build`         | Build the production bundle                       |
| `task preview`       | Build and preview the production bundle           |
| `task data:generate` | Regenerate the canonical country dataset          |
| `task clean`         | Remove build artifacts                            |
| `task docker:build`  | Build the production container image              |
| `task docker:up`     | Build, start, and expose the production container |
| `task docker:down`   | Stop and remove the production container          |

## Environment

Copy `.env.example` to `.env` to override defaults. All variables are
non-secret and client-visible.

| Variable        | Default    | Description                               |
| --------------- | ---------- | ----------------------------------------- |
| `VITE_APP_NAME` | `GeoStake` | Application name shown in the page header |

## License and Attribution

The canonical country dataset is generated from the public-domain CIA World
Factbook via the `factbook.json` repository (CC0 1.0 Universal). See the
[Country Data](#country-data) section for the source and pipeline. No additional
third-party data or assets have been introduced yet.
