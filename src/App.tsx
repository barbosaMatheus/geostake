import GameScreen from './components/GameScreen'
import { MOCK_COUNTRIES } from './data/mockCountries'

function App() {
  return <GameScreen countries={MOCK_COUNTRIES} />
}

export default App
