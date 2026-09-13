import type { GeodeAmount, LifeCount } from '../types/player'

export interface EconomyConfig {
  startingGeodes: GeodeAmount
  startingLives: LifeCount
  baseReward: GeodeAmount
  baseClueDeduction: GeodeAmount
  minimumReward: GeodeAmount
  lifeCost: GeodeAmount
  maxLives: LifeCount
}

export const ECONOMY_CONFIG: EconomyConfig = {
  startingGeodes: 1000,
  startingLives: 3,
  baseReward: 500,
  baseClueDeduction: 10,
  minimumReward: 200,
  lifeCost: 750,
  maxLives: 99,
}
