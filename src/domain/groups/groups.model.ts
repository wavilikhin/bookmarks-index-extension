// Group atoms and actions with server sync
import { atom, action, withAsync, type Atom } from '@reatom/core'

import { api } from '@/api'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import { userIdAtom } from '@/stores/auth/atoms'
import { bookmarksAtom } from '@/domain/bookmarks'

import type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'

// Entity array - each group is wrapped in its own atom for granular updates
export const groupsAtom = atom<Atom<Group>[]>([], 'groups.atom')

// Loading state for groups
export const groupsLoadingAtom = atom(false, 'groups.loading')

/**
 * Helper to normalize server timestamps to ISO strings
 */
function normalizeTimestamp(timestamp: string | Date): string {
  return typeof timestamp === 'string' ? timestamp : timestamp.toISOString()
}

/**
 * Load all groups from server
 */
export const loadGroups = action(async () => {
  groupsLoadingAtom.set(true)
  try {
    const serverGroups = await api.groups.list.query()
    const sortedGroups = [...serverGroups].sort((a, b) => a.order - b.order)
    groupsAtom.set(
      sortedGroups.map((serverGroup) =>
        atom({
          ...serverGroup,
          createdAt: normalizeTimestamp(serverGroup.createdAt),
          updatedAt: normalizeTimestamp(serverGroup.updatedAt)
        } as Group)
      )
    )
    return sortedGroups
  } finally {
    groupsLoadingAtom.set(false)
  }
}, 'groups.load').extend(withAsync())

/**
 * Create a new group with optimistic update
 */
export const createGroup = action(async (input: CreateGroupInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')

  const newId = generateId('group')
  const order = groupsAtom().filter((g) => g().spaceId === input.spaceId).length

  const optimisticGroup: Group = {
    id: newId,
    userId,
    spaceId: input.spaceId,
    name: input.name,
    icon: input.icon,
    order,
    isArchived: false,
    ...createTimestamps()
  }

  // Optimistic update
  const optimisticAtom = atom(optimisticGroup)
  groupsAtom.set((curr) => [...curr, optimisticAtom])

  try {
    const serverGroup = await api.groups.create.mutate({
      id: newId,
      spaceId: input.spaceId,
      name: input.name,
      icon: input.icon,
      order
    })
    // Update optimistic atom with server response
    optimisticAtom.set({
      ...serverGroup,
      createdAt: normalizeTimestamp(serverGroup.createdAt),
      updatedAt: normalizeTimestamp(serverGroup.updatedAt)
    } as Group)
    return newId
  } catch (error) {
    // Rollback on error
    groupsAtom.set((curr) => curr.filter((g) => g !== optimisticAtom))
    throw error
  }
}, 'groups.create').extend(withAsync())

/**
 * Update an existing group with optimistic update
 */
export const updateGroup = action(async (id: string, input: UpdateGroupInput) => {
  const groupToUpdateAtom = groupsAtom().find((g) => g().id === id)
  if (!groupToUpdateAtom) throw new Error('Group not found')

  // Store previous state for rollback
  const previousState = groupToUpdateAtom()

  // Optimistic update
  groupToUpdateAtom.set((currentGroup) => ({
    ...currentGroup,
    ...input,
    ...updateTimestamp()
  }))

  try {
    const serverGroup = await api.groups.update.mutate({
      id,
      name: input.name,
      icon: input.icon,
      spaceId: input.spaceId,
      isArchived: input.isArchived
    })
    // Update with server response
    groupToUpdateAtom.set({
      ...serverGroup,
      createdAt: normalizeTimestamp(serverGroup.createdAt),
      updatedAt: normalizeTimestamp(serverGroup.updatedAt)
    } as Group)
    return serverGroup
  } catch (error) {
    // Rollback on error
    groupToUpdateAtom.set(previousState)
    throw error
  }
}, 'groups.update').extend(withAsync())

/**
 * Delete a group (and related bookmarks) with optimistic update
 */
export const deleteGroup = action(async (groupId: string) => {
  // Store previous state for rollback
  const previousGroups = groupsAtom()
  const previousBookmarks = bookmarksAtom()

  // Optimistic update
  groupsAtom.set((curr) => curr.filter((g) => g().id !== groupId))
  bookmarksAtom.set((curr) => curr.filter((b) => b().groupId !== groupId))

  try {
    await api.groups.delete.mutate({ id: groupId })
  } catch (error) {
    // Rollback on error
    groupsAtom.set(previousGroups)
    bookmarksAtom.set(previousBookmarks)
    throw error
  }
}, 'groups.delete').extend(withAsync())

/**
 * Reorder groups within a space with optimistic update
 */
export const reorderGroups = action(async (spaceId: string, orderedIds: string[]) => {
  // Store previous state for rollback
  const previousStates = new Map<string, Group>()

  // Optimistic update
  orderedIds.forEach((id, index) => {
    const groupAtom = groupsAtom().find((g) => g().id === id)
    if (groupAtom) {
      previousStates.set(id, groupAtom())
      groupAtom.set((currentGroup) => ({
        ...currentGroup,
        order: index,
        ...updateTimestamp()
      }))
    }
  })

  try {
    await api.groups.reorder.mutate({ spaceId, orderedIds })
  } catch (error) {
    // Rollback on error
    previousStates.forEach((previousState, id) => {
      const groupAtom = groupsAtom().find((g) => g().id === id)
      if (groupAtom) {
        groupAtom.set(previousState)
      }
    })
    throw error
  }
}, 'groups.reorder').extend(withAsync())
