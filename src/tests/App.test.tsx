import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the GeoStake title prominently', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
  })

  it('shows the core gameplay tagline', () => {
    render(<App />)

    expect(
      screen.getByText(
        /buy clues, spend geodes, and identify the mystery country/i,
      ),
    ).toBeInTheDocument()
  })
})
