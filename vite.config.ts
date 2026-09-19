import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const APP_DESCRIPTION =
  'GeoStake - a geography puzzle game. Buy clues, spend geodes, and identify the mystery country before your lives run out.'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const APP_BASE = env.VITE_BASE_PATH || '/'

  return {
    base: APP_BASE,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'icons/geostake-192.png',
          'icons/geostake-512.png',
        ],
        manifest: {
          name: 'GeoStake',
          short_name: 'GeoStake',
          description: APP_DESCRIPTION,
          lang: 'en',
          display: 'standalone',
          theme_color: '#2f6db5',
          background_color: '#f6f3ea',
          icons: [
            {
              src: 'icons/geostake-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/geostake-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/geostake-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: [
            '**/*.{js,css,html,json,svg,png,ico,woff,woff2,ttf,avif,webp}',
          ],
          navigateFallback: `${APP_BASE}index.html`,
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
    },
  }
})
