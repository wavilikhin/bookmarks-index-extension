// Space atoms and actions with server sync
import { atom, action, withAsync, wrap, type Atom } from '@reatom/core'

import { api } from '@/api'
import { userIdAtom } from '@/stores/auth/atoms'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import { groupsAtom } from '@/domain/groups'
import { bookmarksAtom } from '@/domain/bookmarks'

import type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'

// Entity array - each space is wrapped in its own atom for granular updates
export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom')

// Loading state for spaces
export const spacesLoadingAtom = atom(false, 'spaces.loading')

// Error state for spaces
export const spacesErrorAtom = atom<string | null>(null, 'spaces.error')

/**
 * Helper to normalize server timestamps to ISO strings
 */
function normalizeTimestamp(timestamp: string | Date): string {
  return typeof timestamp === 'string' ? timestamp : timestamp.toISOString()
}

/**
 * Get space atom by ID
 */
export function getSpaceById(id: string) {
  return spacesAtom().find((s) => s().id === id)
}

/**
 * Helper to extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

/**
 * Load spaces from server
 */
export const loadSpaces = action(async () => {
  spacesLoadingAtom.set(true)
  spacesErrorAtom.set(null)
  try {
    const serverSpaces = await wrap(api.spaces.list.query())
    const sortedSpaces = [...serverSpaces].sort((a, b) => a.order - b.order)
    spacesAtom.set(
      sortedSpaces.map((serverSpace) =>
        atom({
          ...serverSpace,
          createdAt: normalizeTimestamp(serverSpace.createdAt),
          updatedAt: normalizeTimestamp(serverSpace.updatedAt)
        } as Space)
      )
    )
    return sortedSpaces
  } catch (error) {
    spacesErrorAtom.set(getErrorMessage(error))
    throw error
  } finally {
    spacesLoadingAtom.set(false)
  }
}, 'spaces.load').extend(withAsync())

/**
 * Create a new space with optimistic update
 */
export const createSpace = action(async (input: CreateSpaceInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')

  const newId = generateId('space')
  const optimisticSpace: Space = {
    id: newId,
    userId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    order: spacesAtom().length,
    isArchived: false,
    ...createTimestamps()
  }

  // Optimistic update
  const optimisticAtom = atom(optimisticSpace)
  spacesAtom.set((curr) => [...curr, optimisticAtom])

  try {
    const serverSpace = await wrap(
      api.spaces.create.mutate({
        id: newId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        order: optimisticSpace.order
      })
    )
    // Update optimistic atom with server response
    optimisticAtom.set({
      ...serverSpace,
      createdAt: normalizeTimestamp(serverSpace.createdAt),
      updatedAt: normalizeTimestamp(serverSpace.updatedAt)
    } as Space)
    return serverSpace
  } catch (error) {
    // Rollback on error
    spacesAtom.set((curr) => curr.filter((s) => s !== optimisticAtom))
    throw error
  }
}, 'spaces.create').extend(withAsync())

/**
 * Update an existing space with optimistic update
 */
export const updateSpace = action(async (spaceId: string, partialSpace: UpdateSpaceInput) => {
  const spaceToUpdateAtom = spacesAtom().find((s) => s().id === spaceId)
  if (!spaceToUpdateAtom) throw new Error('Space not found')

  // Store previous state for rollback
  const previousState = spaceToUpdateAtom()

  // Optimistic update
  spaceToUpdateAtom.set((currentSpace) => ({
    ...currentSpace,
    ...partialSpace,
    ...updateTimestamp()
  }))

  try {
    const serverSpace = await wrap(
      api.spaces.update.mutate({
        id: spaceId,
        name: partialSpace.name,
        icon: partialSpace.icon,
        color: partialSpace.color,
        isArchived: partialSpace.isArchived
      })
    )
    // Update with server response
    spaceToUpdateAtom.set({
      ...serverSpace,
      createdAt: normalizeTimestamp(serverSpace.createdAt),
      updatedAt: normalizeTimestamp(serverSpace.updatedAt)
    } as Space)
    return serverSpace
  } catch (error) {
    // Rollback on error
    spaceToUpdateAtom.set(previousState)
    throw error
  }
}, 'spaces.update').extend(withAsync())

/**
 * Delete a space (and related groups/bookmarks) with optimistic update
 */
export const deleteSpace = action(async (spaceId: string) => {
  // Store previous state for rollback
  const previousSpaces = spacesAtom()
  const previousGroups = groupsAtom()
  const previousBookmarks = bookmarksAtom()

  // Optimistic update
  spacesAtom.set((curr) => curr.filter((s) => s().id !== spaceId))
  groupsAtom.set((curr) => curr.filter((g) => g().spaceId !== spaceId))
  bookmarksAtom.set((curr) => curr.filter((b) => b().spaceId !== spaceId))

  try {
    await wrap(api.spaces.delete.mutate({ id: spaceId }))
  } catch (error) {
    // Rollback on error
    spacesAtom.set(previousSpaces)
    groupsAtom.set(previousGroups)
    bookmarksAtom.set(previousBookmarks)
    throw error
  }
}, 'spaces.delete').extend(withAsync())

/**
 * Reorder spaces with optimistic update
 */
export const reorderSpaces = action(async (orderedIds: string[]) => {
  // Store previous array order and states for rollback
  const previousArray = spacesAtom()
  const previousStates = new Map<string, Space>()

  // Build new array order and update order fields
  const currentSpaces = spacesAtom()
  const reorderedSpaces = orderedIds
    .map((id, index) => {
      const spaceAtom = currentSpaces.find((s) => s().id === id)
      if (spaceAtom) {
        previousStates.set(id, spaceAtom())
        spaceAtom.set((currentSpace) => ({
          ...currentSpace,
          order: index,
          ...updateTimestamp()
        }))
      }
      return spaceAtom
    })
    .filter(Boolean) as typeof currentSpaces

  // Optimistic update - reorder the array
  spacesAtom.set(reorderedSpaces)

  try {
    await wrap(api.spaces.reorder.mutate({ orderedIds }))
  } catch (error) {
    // Rollback on error - restore array order and states
    spacesAtom.set(previousArray)
    previousStates.forEach((previousState, id) => {
      const spaceAtom = previousArray.find((s) => s().id === id)
      if (spaceAtom) {
        spaceAtom.set(previousState)
      }
    })
    throw error
  }
}, 'spaces.reorder').extend(withAsync())
