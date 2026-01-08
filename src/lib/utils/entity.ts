// Entity utility functions
import { IdPrefixes } from '@/lib/storage/keys'

type EntityPrefix = keyof typeof IdPrefixes

// Custom nanoid implementation for browser extension environment
// Uses crypto.getRandomValues for secure random generation
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function generateRandomId(size: number): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let id = ''
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return id
}

/**
 * Generate a unique ID with an entity-type prefix
 * @param prefix - The entity type prefix (user, space, group, bookmark)
 * @returns A prefixed nanoid (e.g., "space_abc123xyz")
 */
export function generateId(prefix: EntityPrefix): string {
  return `${IdPrefixes[prefix]}${generateRandomId(10)}`
}

/**
 * Create timestamp fields for a new entity
 * @returns Object with createdAt and updatedAt ISO strings
 * TODO: rewrite using .extend()
 */
export function createTimestamps(): { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Create an updated timestamp for entity updates
 * @returns Object with updatedAt ISO string
 */
export function updateTimestamp(): { updatedAt: string } {
  return {
    updatedAt: new Date().toISOString()
  }
}
