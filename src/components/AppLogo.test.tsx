import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AppLogo from './AppLogo'
import GameTitle from './GameTitle'
import GameScreen from './GameScreen'
import { TEST_COUNTRIES } from '../tests/fixtures'

const alwaysSelectFirst = () => 0

describe('AppLogo', () => {
  it('renders the shared app icon as a decorative image', () => {
    render(<AppLogo />)

    const logo = screen.getByAltText('')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/icons/geostake-192.png')
  })

  it('shows the logo beside the game title on the game screen', () => {
    render(<GameScreen countries={TEST_COUNTRIES} random={alwaysSelectFirst} />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      '/icons/geostake-192.png',
    )
  })
})

describe('GameTitle', () => {
  it('renders the app name next to the logo', () => {
    render(<GameTitle />)

    expect(
      screen.getByRole('heading', { level: 1, name: /geostake/i }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('')).toBeInTheDocument()
  })
})
