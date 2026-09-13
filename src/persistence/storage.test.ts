import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../tests/memoryStorage'
import { localStorageAdapter, readJson, writeJson } from './storage'

const TEST_KEY = 'geostake:test-storage'

afterEach(() => {
  localStorage.removeItem(TEST_KEY)
})

describe('readJson / writeJson', () => {
  it('round-trips a value through an in-memory adapter', () => {
    const memory = createMemoryStorage()
    const value = { a: 1, b: 'two' }

    expect(writeJson(TEST_KEY, value, memory)).toBe(true)
    expect(readJson<typeof value>(TEST_KEY, memory)).toEqual(value)
  })

  it('returns null when the key is missing', () => {
    expect(readJson(TEST_KEY, createMemoryStorage())).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    const memory = createMemoryStorage()
    memory.setItem(TEST_KEY, '{not valid json')

    expect(readJson(TEST_KEY, memory)).toBeNull()
  })

  it('returns false when the adapter cannot write', () => {
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage full')
      },
      removeItem: () => undefined,
    }

    expect(writeJson(TEST_KEY, { ok: true }, failing)).toBe(false)
  })

  it('reads and writes through the real localStorage adapter', () => {
    expect(localStorageAdapter.getItem(TEST_KEY)).toBeNull()

    expect(writeJson(TEST_KEY, { value: 42 }, localStorageAdapter)).toBe(true)
    expect(localStorageAdapter.getItem(TEST_KEY)).toBe(
      JSON.stringify({ value: 42 }),
    )
    expect(readJson<{ value: number }>(TEST_KEY, localStorageAdapter)).toEqual({
      value: 42,
    })

    localStorageAdapter.removeItem(TEST_KEY)
    expect(localStorageAdapter.getItem(TEST_KEY)).toBeNull()
  })
})
