import { act, renderHook } from '@testing-library/react'
import { it } from 'vitest'
import { GAME_CONFIG } from './game/config'
import { TEST_COUNTRIES } from './tests/fixtures'
import { useTutorial } from './hooks/useTutorial'

const alwaysSelectFirst = () => 0

it('debug', () => {
  const { result } = renderHook(() =>
    useTutorial(TEST_COUNTRIES, GAME_CONFIG, alwaysSelectFirst),
  )
  console.log('initial ref via call show', result.current.submitGuess.toString().slice(0, 80))
  act(() => {
    result.current.revealClue('capital')
  })
  console.log('after reveal geodes', result.current.tutorialState.game.player.geodes)
  act(() => {
    result.current.revealClue('capital')
  })
  console.log('after reveal 2 geodes', result.current.tutorialState.game.player.geodes)
  act(() => {
    result.current.submitGuess('Atlantis')
  })
  console.log('after wrong guess lives', result.current.tutorialState.game.player.lives)
  console.log('lastIncorrectGuess', result.current.lastIncorrectGuess)
})
