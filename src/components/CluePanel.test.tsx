import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TEST_COUNTRIES } from '../tests/fixtures'
import type { ClueId } from '../types/clue'
import CluePanel from './CluePanel'

const [brazil, japan] = TEST_COUNTRIES

function renderPanel(options?: {
  country?: typeof brazil
  geodes?: number
  startingClueId?: ClueId
  revealedClueIds?: readonly ClueId[]
}) {
  const onReveal = vi.fn()
  render(
    <CluePanel
      country={options?.country ?? brazil}
      geodes={options?.geodes ?? 1000}
      startingClueId={options?.startingClueId ?? 'population'}
      revealedClueIds={options?.revealedClueIds ?? ['population']}
      onReveal={onReveal}
    />,
  )
  return { onReveal }
}

describe('CluePanel', () => {
  it('groups clues under the five tier headings', () => {
    renderPanel()

    for (const tier of ['Free', 'Low', 'Medium', 'High', 'Very High']) {
      expect(
        screen.getByRole('heading', { name: tier, level: 3 }),
      ).toBeInTheDocument()
    }
  })

  it('shows the automatically revealed starting clue and its value', () => {
    renderPanel()

    expect(screen.getByText('Population')).toBeInTheDocument()
    expect(screen.getByText('221,359,387')).toBeInTheDocument()
    expect(screen.getByText('Starting clue')).toBeInTheDocument()
  })

  it('keeps a revealed starting clue hidden behind a purchase control', () => {
    renderPanel()

    expect(
      screen.getByRole('button', { name: 'Land Area · Free' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Region · 50 geodes' }),
    ).toBeInTheDocument()
  })

  it('shows the configured current cost on each purchasable clue', () => {
    renderPanel({ country: japan, geodes: 1000 })

    expect(
      screen.getByRole('button', { name: 'Highest Elevation · 100 geodes' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Internet Country Code · 375 geodes',
      }),
    ).toBeInTheDocument()
  })

  it('reveals a clue after the player activates its control', () => {
    const { onReveal } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Land Area · Free' }))

    expect(onReveal).toHaveBeenCalledWith('land-area')
  })

  it('marks clues whose optional data is missing as unavailable', () => {
    renderPanel()

    expect(screen.getAllByText('Unavailable for this country')).toHaveLength(4)
  })

  it('disables and flags clues that cost more geodes than the player has', () => {
    renderPanel({ geodes: 30 })

    const regionButton = screen.getByRole('button', {
      name: 'Region · 50 geodes',
    })
    expect(regionButton).toBeDisabled()
    expect(screen.getAllByText('Not enough geodes').length).toBeGreaterThan(0)
  })

  it('does not offer a purchase control for an already revealed clue', () => {
    renderPanel()

    expect(
      screen.queryByRole('button', { name: 'Population · Free' }),
    ).not.toBeInTheDocument()
  })
})
