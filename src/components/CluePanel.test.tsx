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
  disabled?: boolean
}) {
  const onReveal = vi.fn()
  render(
    <CluePanel
      country={options?.country ?? brazil}
      geodes={options?.geodes ?? 1000}
      startingClueId={options?.startingClueId ?? 'population'}
      revealedClueIds={options?.revealedClueIds ?? ['population']}
      disabled={options?.disabled}
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
      screen.getByRole('button', { name: 'Region · 50 geodes' }),
    ).toBeInTheDocument()
  })

  it('omits the free-tier clues other than the starting clue', () => {
    renderPanel()

    expect(screen.queryByText('Land Area')).not.toBeInTheDocument()
    expect(screen.queryByText('Population Density')).not.toBeInTheDocument()
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
      screen.getByRole('button', { name: 'Coastline · 100 geodes' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Internet Country Code · 375 geodes',
      }),
    ).toBeInTheDocument()
  })

  it('reveals a clue after the player activates its control', () => {
    const { onReveal } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Region · 50 geodes' }))

    expect(onReveal).toHaveBeenCalledWith('region')
  })

  it('marks clues whose optional data is missing as unavailable', () => {
    renderPanel()

    expect(screen.getAllByText('Unavailable for this country')).toHaveLength(5)
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

  it('disables every purchase while the panel is locked', () => {
    renderPanel({ geodes: 1000, disabled: true })

    expect(
      screen.getByRole('button', { name: 'Region · 50 geodes' }),
    ).toBeDisabled()
    expect(screen.queryAllByRole('button', { name: /· Free/ })).toHaveLength(0)
    expect(
      screen.getByText(/clue purchases are disabled until the next turn/i),
    ).toBeInTheDocument()
  })

  it('keeps revealed values visible while the panel is locked', () => {
    renderPanel({ disabled: true })

    expect(screen.getByText('Population')).toBeInTheDocument()
    expect(screen.getByText('221,359,387')).toBeInTheDocument()
    expect(screen.getByText('Starting clue')).toBeInTheDocument()
  })
})

describe('CluePanel visual clues', () => {
  it('offers the country outline at the tier 3 cost', () => {
    renderPanel({ country: japan })

    const button = screen.getByRole('button', {
      name: 'Country Outline · 250 geodes',
    })
    expect(button).toBeEnabled()
  })

  it('offers the country flag at the tier 4 cost', () => {
    renderPanel({ country: japan })

    const button = screen.getByRole('button', {
      name: 'Country Flag · 375 geodes',
    })
    expect(button).toBeEnabled()
  })

  it('reveals a purchased country outline with a generic accessible label', () => {
    renderPanel({ country: japan, revealedClueIds: ['country-outline'] })

    const image = screen.getByRole('img', { name: 'Country outline clue' })
    expect(image).toBeInTheDocument()
    expect(screen.getByText('Country Outline')).toBeInTheDocument()
    expect(screen.queryByText('Japan')).not.toBeInTheDocument()
  })

  it('reveals a purchased country flag with a generic accessible label', () => {
    renderPanel({ country: japan, revealedClueIds: ['country-flag'] })

    const image = screen.getByRole('img', { name: 'Country flag clue' })
    expect(image).toBeInTheDocument()
    expect(image.querySelectorAll('path').length).toBeGreaterThan(0)
    expect(screen.queryByText('Japan')).not.toBeInTheDocument()
  })

  it('marks visual clues unavailable when the country has no resolvable asset', () => {
    renderPanel({ country: brazil })

    expect(screen.getAllByText('Unavailable for this country')).toHaveLength(5)
    expect(
      screen.queryByRole('button', { name: 'Country Flag · 375 geodes' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Country Outline · 250 geodes' }),
    ).not.toBeInTheDocument()
  })

  it('reveals visual clues with a purchase control click', () => {
    const { onReveal } = renderPanel({ country: japan })

    fireEvent.click(
      screen.getByRole('button', { name: 'Country Flag · 375 geodes' }),
    )

    expect(onReveal).toHaveBeenCalledWith('country-flag')
  })
})
