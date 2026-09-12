import type { GeodeAmount, LifeCount } from '../types/player'

export interface GameConfig {
  startingGeodes: GeodeAmount
  startingLives: LifeCount
}

export const GAME_CONFIG: GameConfig = {
  startingGeodes: 1000,
  startingLives: 3,
}
