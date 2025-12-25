// Data store for Spaces, Groups, and Bookmarks
import { create } from "zustand"
import {
  getSpaces,
  setSpaces,
  getGroups,
  setGroups,
  getBookmarks,
  setBookmarks,
} from "@/lib/storage/idb"
import { createSeedData } from "@/lib/storage/seed"
import { generateId, createTimestamps, updateTimestamp } from "@/lib/utils/entity"
import type {
  Space,
  Group,
  Bookmark,
  CreateSpaceInput,
  CreateGroupInput,
  CreateBookmarkInput,
  UpdateSpaceInput,
  UpdateGroupInput,
  UpdateBookmarkInput,
} from "@/types"

interface DataState {
  // State
  spaces: Space[]
  groups: Group[]
  bookmarks: Bookmark[]
  isLoading: boolean

  // Load data
  loadAllData: (userId: string) => Promise<void>

  // Computed getters
  getSpaceById: (id: string) => Space | undefined
  getGroupsBySpace: (spaceId: string) => Group[]
  getBookmarksByGroup: (groupId: string) => Bookmark[]

  // Space CRUD
  createSpace: (userId: string, input: CreateSpaceInput) => Promise<Space>
  updateSpace: (id: string, input: UpdateSpaceInput) => Promise<void>
  deleteSpace: (userId: string, id: string, hard?: boolean) => Promise<void>
  reorderSpaces: (userId: string, orderedIds: string[]) => Promise<void>

  // Group CRUD
  createGroup: (userId: string, input: CreateGroupInput) => Promise<Group>
  updateGroup: (id: string, input: UpdateGroupInput) => Promise<void>
  deleteGroup: (userId: string, id: string, hard?: boolean) => Promise<void>
  reorderGroups: (
    userId: string,
    spaceId: string,
    orderedIds: string[]
  ) => Promise<void>

  // Bookmark CRUD
  createBookmark: (
    userId: string,
    input: CreateBookmarkInput
  ) => Promise<Bookmark>
  updateBookmark: (id: string, input: UpdateBookmarkInput) => Promise<void>
  deleteBookmark: (userId: string, id: string, hard?: boolean) => Promise<void>
  reorderBookmarks: (
    userId: string,
    groupId: string,
    orderedIds: string[]
  ) => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  spaces: [],
  groups: [],
  bookmarks: [],
  isLoading: false,

  // Load all data for a user
  loadAllData: async (userId: string) => {
    set({ isLoading: true })

    try {
      let [spaces, groups, bookmarks] = await Promise.all([
        getSpaces(userId),
        getGroups(userId),
        getBookmarks(userId),
      ])

      // If no data exists, seed with sample data
      if (spaces.length === 0) {
        const seedData = createSeedData(userId)
        spaces = seedData.spaces
        groups = seedData.groups
        bookmarks = seedData.bookmarks

        // Persist seed data
        await Promise.all([
          setSpaces(userId, spaces),
          setGroups(userId, groups),
          setBookmarks(userId, bookmarks),
        ])
      }

      // Filter out archived items for display
      set({
        spaces: spaces.filter((s) => !s.isArchived),
        groups: groups.filter((g) => !g.isArchived),
        bookmarks: bookmarks.filter((b) => !b.isArchived),
        isLoading: false,
      })
    } catch (error) {
      console.error("Failed to load data:", error)
      set({ isLoading: false })
      throw error
    }
  },

  // Computed getters
  getSpaceById: (id: string) => {
    return get().spaces.find((s) => s.id === id)
  },

  getGroupsBySpace: (spaceId: string) => {
    return get()
      .groups.filter((g) => g.spaceId === spaceId)
      .sort((a, b) => a.order - b.order)
  },

  getBookmarksByGroup: (groupId: string) => {
    return get()
      .bookmarks.filter((b) => b.groupId === groupId)
      .sort((a, b) => a.order - b.order)
  },

  // Space CRUD
  createSpace: async (userId: string, input: CreateSpaceInput) => {
    const { spaces } = get()
    const newSpace: Space = {
      id: generateId("space"),
      userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      order: spaces.length,
      isArchived: false,
      ...createTimestamps(),
    }

    const updatedSpaces = [...spaces, newSpace]
    await setSpaces(userId, updatedSpaces)
    set({ spaces: updatedSpaces })

    return newSpace
  },

  updateSpace: async (id: string, input: UpdateSpaceInput) => {
    const { spaces } = get()
    const space = spaces.find((s) => s.id === id)
    if (!space) throw new Error("Space not found")

    const updatedSpace = { ...space, ...input, ...updateTimestamp() }
    const updatedSpaces = spaces.map((s) => (s.id === id ? updatedSpace : s))

    await setSpaces(space.userId, updatedSpaces)
    set({ spaces: updatedSpaces })
  },

  deleteSpace: async (userId: string, id: string, hard = false) => {
    const { spaces, groups, bookmarks } = get()

    if (hard) {
      // Hard delete - remove from storage
      const updatedSpaces = spaces.filter((s) => s.id !== id)
      const updatedGroups = groups.filter((g) => g.spaceId !== id)
      const groupIds = groups.filter((g) => g.spaceId === id).map((g) => g.id)
      const updatedBookmarks = bookmarks.filter(
        (b) => !groupIds.includes(b.groupId)
      )

      await Promise.all([
        setSpaces(userId, updatedSpaces),
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ])

      set({
        spaces: updatedSpaces,
        groups: updatedGroups,
        bookmarks: updatedBookmarks,
      })
    } else {
      // Soft delete - mark as archived
      const updatedSpaces = spaces.map((s) =>
        s.id === id ? { ...s, isArchived: true, ...updateTimestamp() } : s
      )
      const updatedGroups = groups.map((g) =>
        g.spaceId === id ? { ...g, isArchived: true, ...updateTimestamp() } : g
      )
      const groupIds = groups.filter((g) => g.spaceId === id).map((g) => g.id)
      const updatedBookmarks = bookmarks.map((b) =>
        groupIds.includes(b.groupId)
          ? { ...b, isArchived: true, ...updateTimestamp() }
          : b
      )

      await Promise.all([
        setSpaces(userId, updatedSpaces),
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ])

      set({
        spaces: updatedSpaces.filter((s) => !s.isArchived),
        groups: updatedGroups.filter((g) => !g.isArchived),
        bookmarks: updatedBookmarks.filter((b) => !b.isArchived),
      })
    }
  },

  reorderSpaces: async (userId: string, orderedIds: string[]) => {
    const { spaces } = get()
    const updatedSpaces = orderedIds.map((id, index) => {
      const space = spaces.find((s) => s.id === id)!
      return { ...space, order: index, ...updateTimestamp() }
    })

    await setSpaces(userId, updatedSpaces)
    set({ spaces: updatedSpaces })
  },

  // Group CRUD
  createGroup: async (userId: string, input: CreateGroupInput) => {
    const { groups } = get()
    const spaceGroups = groups.filter((g) => g.spaceId === input.spaceId)

    const newGroup: Group = {
      id: generateId("group"),
      userId,
      spaceId: input.spaceId,
      name: input.name,
      icon: input.icon,
      order: spaceGroups.length,
      isArchived: false,
      ...createTimestamps(),
    }

    const updatedGroups = [...groups, newGroup]
    await setGroups(userId, updatedGroups)
    set({ groups: updatedGroups })

    return newGroup
  },

  updateGroup: async (id: string, input: UpdateGroupInput) => {
    const { groups } = get()
    const group = groups.find((g) => g.id === id)
    if (!group) throw new Error("Group not found")

    const updatedGroup = { ...group, ...input, ...updateTimestamp() }
    const updatedGroups = groups.map((g) => (g.id === id ? updatedGroup : g))

    await setGroups(group.userId, updatedGroups)
    set({ groups: updatedGroups })
  },

  deleteGroup: async (userId: string, id: string, hard = false) => {
    const { groups, bookmarks } = get()

    if (hard) {
      const updatedGroups = groups.filter((g) => g.id !== id)
      const updatedBookmarks = bookmarks.filter((b) => b.groupId !== id)

      await Promise.all([
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ])

      set({ groups: updatedGroups, bookmarks: updatedBookmarks })
    } else {
      const updatedGroups = groups.map((g) =>
        g.id === id ? { ...g, isArchived: true, ...updateTimestamp() } : g
      )
      const updatedBookmarks = bookmarks.map((b) =>
        b.groupId === id ? { ...b, isArchived: true, ...updateTimestamp() } : b
      )

      await Promise.all([
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ])

      set({
        groups: updatedGroups.filter((g) => !g.isArchived),
        bookmarks: updatedBookmarks.filter((b) => !b.isArchived),
      })
    }
  },

  reorderGroups: async (
    userId: string,
    spaceId: string,
    orderedIds: string[]
  ) => {
    const { groups } = get()
    const otherGroups = groups.filter((g) => g.spaceId !== spaceId)
    const reorderedGroups = orderedIds.map((id, index) => {
      const group = groups.find((g) => g.id === id)!
      return { ...group, order: index, ...updateTimestamp() }
    })

    const updatedGroups = [...otherGroups, ...reorderedGroups]
    await setGroups(userId, updatedGroups)
    set({ groups: updatedGroups })
  },

  // Bookmark CRUD
  createBookmark: async (userId: string, input: CreateBookmarkInput) => {
    const { groups, bookmarks } = get()
    const group = groups.find((g) => g.id === input.groupId)
    if (!group) throw new Error("Group not found")

    const groupBookmarks = bookmarks.filter((b) => b.groupId === input.groupId)

    const newBookmark: Bookmark = {
      id: generateId("bookmark"),
      userId,
      spaceId: group.spaceId,
      groupId: input.groupId,
      title: input.title,
      url: input.url,
      description: input.description,
      order: groupBookmarks.length,
      isPinned: false,
      isArchived: false,
      ...createTimestamps(),
    }

    const updatedBookmarks = [...bookmarks, newBookmark]
    await setBookmarks(userId, updatedBookmarks)
    set({ bookmarks: updatedBookmarks })

    return newBookmark
  },

  updateBookmark: async (id: string, input: UpdateBookmarkInput) => {
    const { bookmarks } = get()
    const bookmark = bookmarks.find((b) => b.id === id)
    if (!bookmark) throw new Error("Bookmark not found")

    const updatedBookmark = { ...bookmark, ...input, ...updateTimestamp() }
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === id ? updatedBookmark : b
    )

    await setBookmarks(bookmark.userId, updatedBookmarks)
    set({ bookmarks: updatedBookmarks })
  },

  deleteBookmark: async (userId: string, id: string, hard = false) => {
    const { bookmarks } = get()

    if (hard) {
      const updatedBookmarks = bookmarks.filter((b) => b.id !== id)
      await setBookmarks(userId, updatedBookmarks)
      set({ bookmarks: updatedBookmarks })
    } else {
      const updatedBookmarks = bookmarks.map((b) =>
        b.id === id ? { ...b, isArchived: true, ...updateTimestamp() } : b
      )
      await setBookmarks(userId, updatedBookmarks)
      set({ bookmarks: updatedBookmarks.filter((b) => !b.isArchived) })
    }
  },

  reorderBookmarks: async (
    userId: string,
    groupId: string,
    orderedIds: string[]
  ) => {
    const { bookmarks } = get()
    const otherBookmarks = bookmarks.filter((b) => b.groupId !== groupId)
    const reorderedBookmarks = orderedIds.map((id, index) => {
      const bookmark = bookmarks.find((b) => b.id === id)!
      return { ...bookmark, order: index, ...updateTimestamp() }
    })

    const updatedBookmarks = [...otherBookmarks, ...reorderedBookmarks]
    await setBookmarks(userId, updatedBookmarks)
    set({ bookmarks: updatedBookmarks })
  },
}))
