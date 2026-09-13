import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ECONOMY_CONFIG } from '../game/economyConfig'
import StatusBar from './StatusBar'

function renderBar(options?: {
  player?: { geodes: number; lives: number }
  turn?: number
  disabled?: boolean
}) {
  const onBuyLife = vi.fn()
  render(
    <StatusBar
      player={options?.player ?? { geodes: 1000, lives: 3 }}
      turn={options?.turn ?? 1}
      economy={ECONOMY_CONFIG}
      disabled={options?.disabled}
      onBuyLife={onBuyLife}
    />,
  )
  return { onBuyLife }
}

function buyButton() {
  return screen.getByRole('button', { name: 'Buy Life · 750 geodes' })
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
})
