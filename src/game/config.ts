import { ECONOMY_CONFIG, type EconomyConfig } from './economyConfig'

export interface GameConfig {
  continueOnCorrectGuess: boolean
  economy: EconomyConfig
}

export const GAME_CONFIG: GameConfig = {
  continueOnCorrectGuess: true,
  economy: ECONOMY_CONFIG,
}
