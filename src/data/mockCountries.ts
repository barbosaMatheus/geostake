import type { Country } from '../types/country'

// Temporary development dataset for demonstrating the Phase 1 interface. It is
// deliberately separated from the canonical, normalized GeoStake country
// dataset that will be added in a later phase. Mock ids are prefixed so they
// can never collide with real country codes.
export const MOCK_COUNTRIES: readonly Country[] = [
  {
    id: 'mock-brazil',
    name: 'Brazil',
    startingClue: 'The largest country in South America.',
  },
  {
    id: 'mock-france',
    name: 'France',
    startingClue: 'Its capital city is Paris.',
  },
  {
    id: 'mock-japan',
    name: 'Japan',
    startingClue: 'An island nation off the eastern coast of Asia.',
  },
  {
    id: 'mock-egypt',
    name: 'Egypt',
    startingClue: 'Home to the River Nile and the Great Pyramids.',
  },
  {
    id: 'mock-canada',
    name: 'Canada',
    startingClue: 'The second-largest country in the world by area.',
  },
  {
    id: 'mock-australia',
    name: 'Australia',
    startingClue: 'A country and continent surrounded by ocean.',
  },
]
