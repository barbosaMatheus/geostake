import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '../..')

function publicPath(...parts: string[]) {
  return resolve(projectRoot, 'public', ...parts)
}

function readPngDimensions(path: string) {
  const bytes = readFileSync(path)
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  )
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

describe('PWA assets', () => {
  it('ships the required installable icons and favicon', () => {
    const hundredNinetyTwo = readPngDimensions(
      publicPath('icons', 'geostake-192.png'),
    )
    const fiveHundredTwelve = readPngDimensions(
      publicPath('icons', 'geostake-512.png'),
    )

    expect(hundredNinetyTwo).toEqual({ width: 192, height: 192 })
    expect(fiveHundredTwelve).toEqual({ width: 512, height: 512 })
    expect(existsSync(publicPath('favicon.svg'))).toBe(true)
  })

  it('index.html marks up the favicon and mobile app icon', () => {
    const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8')

    expect(html).toMatch(
      /rel="icon" type="image\/svg\+xml" sizes="any" href="\/favicon\.svg\?v=\d+"/,
    )
    expect(html).toMatch(
      /rel="icon"\s+type="image\/png"\s+sizes="192x192"\s+href="\/icons\/geostake-192\.png\?v=\d+"/,
    )
    expect(html).toMatch(
      /rel="icon"\s+type="image\/png"\s+sizes="512x512"\s+href="\/icons\/geostake-512\.png\?v=\d+"/,
    )
    expect(html).toMatch(
      /rel="apple-touch-icon" href="\/icons\/geostake-192\.png"/,
    )
    expect(html).toContain('name="theme-color"')
  })

  it('seed assets are referenced only through the shared public directory', () => {
    expect(publicPath('icons', 'geostake-192.png')).not.toContain('dist')
    expect(publicPath('icons', 'geostake-512.png')).not.toContain('dist')
  })
})

describe('PWA configuration', () => {
  it('configures the PWA plugin with the expected manifest', () => {
    const config = readFileSync(resolve(projectRoot, 'vite.config.ts'), 'utf8')

    expect(config).toContain("from 'vite-plugin-pwa'")
    expect(config).toContain('registerType:')
    expect(config).toContain('name:')
    expect(config).toContain("short_name: 'GeoStake'")
    expect(config).toContain("display: 'standalone'")
    expect(config).toContain('icons/geostake-192.png')
    expect(config).toContain('icons/geostake-512.png')
    expect(config).toContain('navigateFallback:')
  })

  it('keeps the deployment base subpath-safe for GitHub Pages', () => {
    const config = readFileSync(resolve(projectRoot, 'vite.config.ts'), 'utf8')

    expect(config).toContain('base: APP_BASE')
    expect(config).toContain('APP_BASE = env.VITE_BASE_PATH || ')
    expect(config).toContain('navigateFallback: `${APP_BASE}index.html`')
    expect(config).not.toContain("start_url: '/'")
    expect(config).not.toContain("scope: '/'")
  })
})
