export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null
    }
    return localStorage
  } catch {
    return null
  }
}

export const localStorageAdapter: StorageAdapter = {
  getItem: (key) => safeLocalStorage()?.getItem(key) ?? null,
  setItem: (key, value) => {
    safeLocalStorage()?.setItem(key, value)
  },
  removeItem: (key) => {
    safeLocalStorage()?.removeItem(key)
  },
}

export function readJson<T>(key: string, adapter: StorageAdapter): T | null {
  try {
    const raw = adapter.getItem(key)
    if (raw === null) {
      return null
    }
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson<T>(
  key: string,
  value: T,
  adapter: StorageAdapter,
): boolean {
  try {
    adapter.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
