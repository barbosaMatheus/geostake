import { describe, expect, it } from 'vitest'
import { getFlagComponent } from './flagAtlas'

describe('getFlagComponent', () => {
  it('resolves a React flag component for known ISO codes', () => {
    for (const iso of ['BR', 'US', 'JP', 'GB', 'FR']) {
      const component = getFlagComponent(iso)
      expect(component, `missing flag for ${iso}`).not.toBeNull()
      expect(typeof component).toBe('function')
    }
  })

  it('returns null for unknown ISO codes', () => {
    expect(getFlagComponent('XX')).toBeNull()
    expect(getFlagComponent('ZZ')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getFlagComponent(null)).toBeNull()
  })
})
