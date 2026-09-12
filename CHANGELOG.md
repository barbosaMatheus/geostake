# Changelog

All notable changes to GeoStake are documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

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
