// Entity utility functions
import {nanoid} from "nanoid"
import {IdPrefixes} from "@/lib/storage/keys"

type EntityPrefix = keyof typeof IdPrefixes

/**
 * Generate a unique ID with an entity-type prefix
 * @param prefix - The entity type prefix (user, space, group, bookmark)
 * @returns A prefixed nanoid (e.g., "space_abc123xyz")
 */
export function generateId(prefix: EntityPrefix): string {
  return `${IdPrefixes[prefix]}${nanoid(10)}`
}

/**
 * Create timestamp fields for a new entity
 * @returns Object with createdAt and updatedAt ISO strings
 * TODO: rewrite using .extend()
 */
export function createTimestamps(): {createdAt: string; updatedAt: string} {
  const now = new Date().toISOString()
  return {
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Create an updated timestamp for entity updates
 * @returns Object with updatedAt ISO string
 */
export function updateTimestamp(): {updatedAt: string} {
  return {
    updatedAt: new Date().toISOString(),
  }
}
