import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ECONOMY_CONFIG } from '../game/economyConfig'
import StatusBar from './StatusBar'

function renderBar(options?: {
  player?: { geodes: number; lives: number }
  turn?: number
  disabled?: boolean
  home?: boolean
  skip?: boolean
}) {
  const onBuyLife = vi.fn()
  const onHome = vi.fn()
  const onSkip = vi.fn()
  render(
    <StatusBar
      player={options?.player ?? { geodes: 1000, lives: 3 }}
      turn={options?.turn ?? 1}
      economy={ECONOMY_CONFIG}
      disabled={options?.disabled}
      onHome={options?.home ? onHome : undefined}
      onBuyLife={onBuyLife}
      onSkip={options?.skip ? onSkip : undefined}
    />,
  )
  return { onBuyLife, onHome, onSkip }
}

function buyButton() {
  return screen.getByRole('button', { name: 'Buy Life · 750 geodes' })
}

function homeButton() {
  return screen.getByRole('button', { name: /^home$/i })
}

function skipButton() {
  return screen.getByRole('button', { name: /^skip$/i })
}

describe('StatusBar', () => {
  it('shows geodes, lives, and the current turn', () => {
    renderBar()

    expect(screen.getByText('Geodes')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('Lives')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Turn')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('purchases a life when the button is activated', () => {
    const { onBuyLife } = renderBar()

    fireEvent.click(buyButton())

    expect(onBuyLife).toHaveBeenCalledTimes(1)
  })

  it('disables the purchase button when the player cannot afford it', () => {
    renderBar({
      player: { geodes: ECONOMY_CONFIG.lifeCost - 1, lives: 3 },
    })

    expect(buyButton()).toBeDisabled()
    expect(screen.getByText(/not enough geodes/i)).toBeInTheDocument()
  })

  it('disables the purchase button at the maximum life count', () => {
    renderBar({ player: { geodes: 1000, lives: ECONOMY_CONFIG.maxLives } })

    expect(buyButton()).toBeDisabled()
    expect(screen.getByText(/lives are maxed out/i)).toBeInTheDocument()
  })

  it('allows a purchase one below the maximum life count', () => {
    renderBar({
      player: { geodes: 1000, lives: ECONOMY_CONFIG.maxLives - 1 },
    })

    expect(buyButton()).toBeEnabled()
  })

  it('locks all purchases while the turn is resolved', () => {
    const { onBuyLife } = renderBar({ disabled: true })

    expect(buyButton()).toBeDisabled()
    fireEvent.click(buyButton())
    expect(onBuyLife).not.toHaveBeenCalled()
  })

  it('omits the home and skip controls when no handlers are provided', () => {
    renderBar()

    expect(screen.queryByRole('button', { name: /^home$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^skip$/i })).toBeNull()
  })

  it('returns to the landing screen from home', () => {
    const { onHome } = renderBar({ home: true })

    fireEvent.click(homeButton())

    expect(onHome).toHaveBeenCalledTimes(1)
  })

  it('skips to the next turn when skip is activated', () => {
    const { onSkip } = renderBar({ skip: true })

    fireEvent.click(skipButton())

    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
