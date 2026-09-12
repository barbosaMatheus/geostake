# GeoStake

GeoStake is a browser-based geography puzzle game designed primarily for tablet
play. Identify a mystery country from progressively more revealing clues while
managing a limited supply of **geodes** (currency) and **lives**. Clues can be
purchased for geodes; correct guesses award geodes, and incorrect guesses cost a
life. The game runs fully offline once loaded, with no backend.

> How much information are you willing to buy before making your guess?

GeoStake is currently in early development. The first playable game screen is
implemented: it shows your geodes and lives, a mystery country with a starting
clue, a country-name guess input, guess feedback, and a way to start the next
turn. A small temporary mock country dataset powers the interface. The clue
purchasing system, geode economy, persistence, real country dataset, and PWA
support are not implemented yet.

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

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `task install`      | Install dependencies                              |
| `task dev`          | Start the Vite development server                 |
| `task test`         | Run the test suite once                           |
| `task test:watch`   | Run the test suite in watch mode                  |
| `task typecheck`    | Run the TypeScript type checker                   |
| `task lint`         | Lint with ESLint                                  |
| `task format`       | Format with Prettier                              |
| `task build`        | Build the production bundle                       |
| `task preview`      | Build and preview the production bundle           |
| `task clean`        | Remove build artifacts                            |
| `task docker:build` | Build the production container image              |
| `task docker:up`    | Build, start, and expose the production container |
| `task docker:down`  | Stop and remove the production container          |

## Environment

Copy `.env.example` to `.env` to override defaults. All variables are
non-secret and client-visible.

| Variable        | Default    | Description                               |
| --------------- | ---------- | ----------------------------------------- |
| `VITE_APP_NAME` | `GeoStake` | Application name shown in the page header |

## License and Attribution

No external data or assets have been introduced yet. Future data sources and
their licenses will be documented here.
