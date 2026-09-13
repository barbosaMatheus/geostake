export type Hemisphere =
  | 'Northern-Eastern'
  | 'Northern-Western'
  | 'Southern-Eastern'
  | 'Southern-Western'

export interface Country {
  id: string
  name: string
  population: number
  landAreaKm2: number
  region: string
  hemisphere: Hemisphere
  populationDensity: number
  capital: string
  coastlineKm?: number
  lowestElevationM?: number
  highestElevationM?: number
  internetCountryCode?: string
  nationalColors?: string[]
  flag: string
  outline: string
  startingClue: string
}
