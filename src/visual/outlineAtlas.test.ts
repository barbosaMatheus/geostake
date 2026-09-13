import { describe, expect, it } from 'vitest'
import { getOutlineGeometry } from './outlineAtlas'

describe('getOutlineGeometry', () => {
  it('resolves geometry for representative countries', () => {
    for (const iso of ['BR', 'US', 'JP', 'GB', 'FR', 'CN']) {
      const outline = getOutlineGeometry(iso)
      expect(outline, `missing outline for ${iso}`).not.toBeNull()
      expect(outline?.path).toContain('M')
      expect(outline?.path).toContain('Z')
    }
  })

  it('renders countries with multiple polygons/islands as multiple subpaths', () => {
    const outline = getOutlineGeometry('BR')
    expect(outline).not.toBeNull()
    const subpaths = outline?.path.match(/M/g) ?? []
    expect(subpaths.length).toBeGreaterThan(1)
  })

  it("keeps each country's bounds inside the world coordinate space", () => {
    for (const iso of ['BR', 'US', 'JP', 'IQ', 'SJ']) {
      const { bounds } = getOutlineGeometry(iso)!
      expect(bounds.minX).toBeGreaterThanOrEqual(-180)
      expect(bounds.maxX).toBeLessThanOrEqual(180)
      expect(bounds.minY).toBeGreaterThanOrEqual(-90)
      expect(bounds.maxY).toBeLessThanOrEqual(90)
      expect(bounds.maxX).toBeGreaterThan(bounds.minX)
      expect(bounds.maxY).toBeGreaterThan(bounds.minY)
    }
  })

  it("does not leak other countries' geometry into a lookup", () => {
    const us = getOutlineGeometry('US')!
    const jp = getOutlineGeometry('JP')!
    const br = getOutlineGeometry('BR')!
    const fr = getOutlineGeometry('FR')!

    expect(us.path).not.toBe(jp.path)
    expect(jp.path).not.toBe(br.path)
    expect(fr.path).not.toBe(us.path)

    expect(br.bounds.maxX).toBeLessThan(0)
    expect(jp.bounds.minX).toBeGreaterThan(0)
    expect(fr.bounds.maxX).toBeLessThan(60)
  })

  it('bounds each country rather than the world', () => {
    for (const iso of ['US', 'JP', 'CN', 'BR', 'FR', 'GB']) {
      const { bounds } = getOutlineGeometry(iso)!
      const width = bounds.maxX - bounds.minX
      const height = bounds.maxY - bounds.minY
      expect(width).toBeGreaterThan(0)
      expect(width).toBeLessThan(360)
      expect(height).toBeGreaterThan(0)
      expect(height).toBeLessThan(180)
    }

    const us = getOutlineGeometry('US')!
    expect(us.bounds.minX).toBeGreaterThan(-180)
    expect(us.bounds.minX).toBeLessThan(-100)
  })

  it('returns null for unknown ISO codes', () => {
    expect(getOutlineGeometry('XX')).toBeNull()
    expect(getOutlineGeometry('ZZ')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getOutlineGeometry(null)).toBeNull()
  })
})
