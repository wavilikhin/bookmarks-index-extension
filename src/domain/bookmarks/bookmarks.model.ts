// Bookmark atoms and actions with server sync
import { atom, action, withAsync, type Atom } from '@reatom/core'

import { api } from '@/api'
import { userIdAtom } from '@/stores/auth/atoms'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'

import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './bookmarks.types'

// Entity array - each bookmark is wrapped in its own atom for granular updates
export const bookmarksAtom = atom<Atom<Bookmark>[]>([], 'bookmarks.atom')

// Loading state for bookmarks
export const bookmarksLoadingAtom = atom(false, 'bookmarks.loading')

/**
 * Helper to normalize server timestamps to ISO strings
 */
function normalizeTimestamp(timestamp: string | Date): string {
  return typeof timestamp === 'string' ? timestamp : timestamp.toISOString()
}

/**
 * Load all bookmarks from server
 */
export const loadBookmarks = action(async () => {
  bookmarksLoadingAtom.set(true)
  try {
    const serverBookmarks = await api.bookmarks.list.query()
    const sortedBookmarks = [...serverBookmarks].sort((a, b) => a.order - b.order)
    bookmarksAtom.set(
      sortedBookmarks.map((serverBookmark) =>
        atom({
          ...serverBookmark,
          createdAt: normalizeTimestamp(serverBookmark.createdAt),
          updatedAt: normalizeTimestamp(serverBookmark.updatedAt)
        } as Bookmark)
      )
    )
    return sortedBookmarks
  } finally {
    bookmarksLoadingAtom.set(false)
  }
}, 'bookmarks.load').extend(withAsync())

/**
 * Create a new bookmark with optimistic update
 */
export const createBookmark = action(async (input: CreateBookmarkInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')

  const newId = generateId('bookmark')
  const order = bookmarksAtom().filter((b) => b().groupId === input.groupId).length

  const optimisticBookmark: Bookmark = {
    id: newId,
    userId,
    spaceId: input.spaceId,
    groupId: input.groupId,
    title: input.title,
    url: input.url,
    description: input.description,
    order,
    isPinned: false,
    isArchived: false,
    ...createTimestamps()
  }

  // Optimistic update
  const optimisticAtom = atom(optimisticBookmark)
  bookmarksAtom.set((curr) => [...curr, optimisticAtom])

  try {
    const serverBookmark = await api.bookmarks.create.mutate({
      id: newId,
      spaceId: input.spaceId,
      groupId: input.groupId,
      title: input.title,
      url: input.url,
      description: input.description,
      order
    })
    // Update optimistic atom with server response
    optimisticAtom.set({
      ...serverBookmark,
      createdAt: normalizeTimestamp(serverBookmark.createdAt),
      updatedAt: normalizeTimestamp(serverBookmark.updatedAt)
    } as Bookmark)
    return serverBookmark
  } catch (error) {
    // Rollback on error
    bookmarksAtom.set((curr) => curr.filter((b) => b !== optimisticAtom))
    throw error
  }
}, 'bookmarks.create').extend(withAsync())

/**
 * Update an existing bookmark with optimistic update
 */
export const updateBookmark = action(async (bookmarkId: string, partialBookmark: UpdateBookmarkInput) => {
  const bookmarkToUpdateAtom = bookmarksAtom().find((b) => b().id === bookmarkId)
  if (!bookmarkToUpdateAtom) throw new Error('Bookmark not found')

  // Store previous state for rollback
  const previousState = bookmarkToUpdateAtom()

  // Optimistic update
  bookmarkToUpdateAtom.set((currentBookmark) => ({
    ...currentBookmark,
    ...partialBookmark,
    ...updateTimestamp()
  }))

  try {
    const serverBookmark = await api.bookmarks.update.mutate({
      id: bookmarkId,
      title: partialBookmark.title,
      url: partialBookmark.url,
      description: partialBookmark.description,
      faviconUrl: partialBookmark.faviconUrl,
      groupId: partialBookmark.groupId,
      spaceId: partialBookmark.spaceId,
      isPinned: partialBookmark.isPinned,
      isArchived: partialBookmark.isArchived
    })
    // Update with server response
    bookmarkToUpdateAtom.set({
      ...serverBookmark,
      createdAt: normalizeTimestamp(serverBookmark.createdAt),
      updatedAt: normalizeTimestamp(serverBookmark.updatedAt)
    } as Bookmark)
    return serverBookmark
  } catch (error) {
    // Rollback on error
    bookmarkToUpdateAtom.set(previousState)
    throw error
  }
}, 'bookmarks.update').extend(withAsync())

/**
 * Delete a bookmark with optimistic update
 */
export const deleteBookmark = action(async (bookmarkId: string) => {
  // Store previous state for rollback
  const previousBookmarks = bookmarksAtom()

  // Optimistic update
  bookmarksAtom.set((curr) => curr.filter((b) => b().id !== bookmarkId))

  try {
    await api.bookmarks.delete.mutate({ id: bookmarkId })
  } catch (error) {
    // Rollback on error
    bookmarksAtom.set(previousBookmarks)
    throw error
  }
}, 'bookmarks.delete').extend(withAsync())

/**
 * Reorder bookmarks within a group with optimistic update
 */
export const reorderBookmarks = action(async (groupId: string, orderedIds: string[]) => {
  // Store previous state for rollback
  const previousStates = new Map<string, Bookmark>()

  // Optimistic update
  orderedIds.forEach((id, index) => {
    const bookmarkAtom = bookmarksAtom().find((b) => b().id === id)
    if (bookmarkAtom) {
      previousStates.set(id, bookmarkAtom())
      bookmarkAtom.set((currentBookmark) => ({
        ...currentBookmark,
        order: index,
        ...updateTimestamp()
      }))
    }
  })

  try {
    await api.bookmarks.reorder.mutate({ groupId, orderedIds })
  } catch (error) {
    // Rollback on error
    previousStates.forEach((previousState, id) => {
      const bookmarkAtom = bookmarksAtom().find((b) => b().id === id)
      if (bookmarkAtom) {
        bookmarkAtom.set(previousState)
      }
    })
    throw error
  }
}, 'bookmarks.reorder').extend(withAsync())

/**
 * Move bookmark to a different group with optimistic update
 */
export const moveBookmark = action(async (bookmarkId: string, groupId: string, spaceId: string) => {
  const bookmarkToMoveAtom = bookmarksAtom().find((b) => b().id === bookmarkId)
  if (!bookmarkToMoveAtom) throw new Error('Bookmark not found')

  // Store previous state for rollback
  const previousState = bookmarkToMoveAtom()

  // Calculate new order in target group
  const newOrder = bookmarksAtom().filter((b) => b().groupId === groupId).length

  // Optimistic update
  bookmarkToMoveAtom.set((currentBookmark) => ({
    ...currentBookmark,
    groupId,
    spaceId,
    order: newOrder,
    ...updateTimestamp()
  }))

  try {
    const serverBookmark = await api.bookmarks.move.mutate({
      id: bookmarkId,
      groupId,
      spaceId
    })
    // Update with server response
    bookmarkToMoveAtom.set({
      ...serverBookmark,
      createdAt: normalizeTimestamp(serverBookmark.createdAt),
      updatedAt: normalizeTimestamp(serverBookmark.updatedAt)
    } as Bookmark)
    return serverBookmark
  } catch (error) {
    // Rollback on error
    bookmarkToMoveAtom.set(previousState)
    throw error
  }
}, 'bookmarks.move').extend(withAsync())
