import { reatomPersist, createMemStorage } from '@reatom/core/build/persist'
import { get, set, del } from 'idb-keyval'

const STORAGE_NAMESPACE = 'bookmarks-index:'

function getStorageKey(key: string): string {
  return `${STORAGE_NAMESPACE}${key}`
}

function createIndexedDBStorage() {
  return {
    name: 'indexeddb-storage',
    cache: createMemStorage({ name: 'indexeddb-fallback' }).cache,
    get: async ({ key }: { key: string }) => {
      try {
        const storageKey = getStorageKey(key)
        const value = await get(storageKey)
        return value ?? null
      } catch (error) {
        console.warn(`[IndexedDB] Failed to read key "${key}":`, error)
        return null
      }
    },
    set: async ({ key }: { key: string }, record: unknown) => {
      try {
        const storageKey = getStorageKey(key)
        await set(storageKey, record)
      } catch (error) {
        console.warn(`[IndexedDB] Failed to write key "${key}":`, error)
      }
    },
    clear: async ({ key }: { key: string }) => {
      try {
        const storageKey = getStorageKey(key)
        await del(storageKey)
      } catch (error) {
        console.warn(`[IndexedDB] Failed to clear key "${key}":`, error)
      }
    }
  }
}

export const withIndexedDBStorage = reatomPersist(createIndexedDBStorage())
export { createIndexedDBStorage }
