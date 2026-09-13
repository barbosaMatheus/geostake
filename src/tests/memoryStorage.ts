import type { StorageAdapter } from '../persistence/storage'

export interface MemoryStorage extends StorageAdapter {
  readonly size: number
}

export function createMemoryStorage(): MemoryStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    get size() {
      return store.size
    },
  }
}
