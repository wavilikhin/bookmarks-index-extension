// Data actions for CRUD operations on spaces, groups, and bookmarks
import { action } from "@reatom/core";
import {
  spacesAtom,
  groupsAtom,
  bookmarksAtom,
  isDataLoadingAtom,
} from "./atoms";
import {
  getSpaces,
  setSpaces,
  getGroups,
  setGroups,
  getBookmarks,
  setBookmarks,
} from "@/lib/storage/idb";
import { createSeedData } from "@/lib/storage/seed";
import {
  generateId,
  createTimestamps,
  updateTimestamp,
} from "@/lib/utils/entity";
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
} from "@/types";

// ============================================
// Load Data
// ============================================

/**
 * Load all data for a user from IndexedDB
 */
export const loadAllData = action(async (userId: string) => {
  isDataLoadingAtom.set(true);

  try {
    // Load all data - use Promise.all and await the result
    const [spacesData, groupsData, bookmarksData] = await Promise.all([
      getSpaces(userId),
      getGroups(userId),
      getBookmarks(userId),
    ]);

    let spaces = spacesData;
    let groups = groupsData;
    let bookmarks = bookmarksData;

    // If no data exists, seed with sample data
    if (spaces.length === 0) {
      const seedData = createSeedData(userId);
      spaces = seedData.spaces;
      groups = seedData.groups;
      bookmarks = seedData.bookmarks;

      // Persist seed data
      await Promise.all([
        setSpaces(userId, spaces),
        setGroups(userId, groups),
        setBookmarks(userId, bookmarks),
      ]);
    }

    // Filter out archived items for display and set state
    spacesAtom.set(spaces.filter((s) => !s.isArchived));
    groupsAtom.set(groups.filter((g) => !g.isArchived));
    bookmarksAtom.set(bookmarks.filter((b) => !b.isArchived));
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
  } finally {
    isDataLoadingAtom.set(false);
  }
}, "data.loadAllData");

/**
 * Clear all data from state (used on logout)
 */
export const clearAllData = action(() => {
  spacesAtom.set([]);
  groupsAtom.set([]);
  bookmarksAtom.set([]);
}, "data.clearAllData");

// ============================================
// Space CRUD
// ============================================

/**
 * Create a new space
 */
export const createSpace = action(
  async (userId: string, input: CreateSpaceInput) => {
    const spaces = spacesAtom();
    const newSpace: Space = {
      id: generateId("space"),
      userId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      order: spaces.length,
      isArchived: false,
      ...createTimestamps(),
    };

    const updatedSpaces = [...spaces, newSpace];
    await setSpaces(userId, updatedSpaces);
    spacesAtom.set(updatedSpaces);

    return newSpace;
  },
  "data.createSpace",
);

/**
 * Update an existing space
 */
export const updateSpace = action(
  async (id: string, input: UpdateSpaceInput) => {
    const spaces = spacesAtom();
    const space = spaces.find((s) => s.id === id);
    if (!space) throw new Error("Space not found");

    const updatedSpace = { ...space, ...input, ...updateTimestamp() };
    const updatedSpaces = spaces.map((s) => (s.id === id ? updatedSpace : s));

    await setSpaces(space.userId, updatedSpaces);
    spacesAtom.set(updatedSpaces);
  },
  "data.updateSpace",
);

/**
 * Delete a space (soft or hard delete)
 */
export const deleteSpace = action(
  async (userId: string, id: string, hard = false) => {
    const spaces = spacesAtom();
    const groups = groupsAtom();
    const bookmarks = bookmarksAtom();

    if (hard) {
      // Hard delete - remove from storage
      const updatedSpaces = spaces.filter((s) => s.id !== id);
      const updatedGroups = groups.filter((g) => g.spaceId !== id);
      const groupIds = groups.filter((g) => g.spaceId === id).map((g) => g.id);
      const updatedBookmarks = bookmarks.filter(
        (b) => !groupIds.includes(b.groupId),
      );

      await Promise.all([
        setSpaces(userId, updatedSpaces),
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ]);

      spacesAtom.set(updatedSpaces);
      groupsAtom.set(updatedGroups);
      bookmarksAtom.set(updatedBookmarks);
    } else {
      // Soft delete - mark as archived
      const updatedSpaces = spaces.map((s) =>
        s.id === id ? { ...s, isArchived: true, ...updateTimestamp() } : s,
      );
      const updatedGroups = groups.map((g) =>
        g.spaceId === id ? { ...g, isArchived: true, ...updateTimestamp() } : g,
      );
      const groupIds = groups.filter((g) => g.spaceId === id).map((g) => g.id);
      const updatedBookmarks = bookmarks.map((b) =>
        groupIds.includes(b.groupId)
          ? { ...b, isArchived: true, ...updateTimestamp() }
          : b,
      );

      await Promise.all([
        setSpaces(userId, updatedSpaces),
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ]);

      spacesAtom.set(updatedSpaces.filter((s) => !s.isArchived));
      groupsAtom.set(updatedGroups.filter((g) => !g.isArchived));
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteSpace",
);

/**
 * Reorder spaces
 */
export const reorderSpaces = action(
  async (userId: string, orderedIds: string[]) => {
    const spaces = spacesAtom();
    const updatedSpaces = orderedIds.map((id, index) => {
      const space = spaces.find((s) => s.id === id)!;
      return { ...space, order: index, ...updateTimestamp() };
    });

    await setSpaces(userId, updatedSpaces);
    spacesAtom.set(updatedSpaces);
  },
  "data.reorderSpaces",
);

// ============================================
// Group CRUD
// ============================================

/**
 * Create a new group
 */
export const createGroup = action(
  async (userId: string, input: CreateGroupInput) => {
    const groups = groupsAtom();
    const spaceGroups = groups.filter((g) => g.spaceId === input.spaceId);

    const newGroup: Group = {
      id: generateId("group"),
      userId,
      spaceId: input.spaceId,
      name: input.name,
      icon: input.icon,
      order: spaceGroups.length,
      isArchived: false,
      ...createTimestamps(),
    };

    const updatedGroups = [...groups, newGroup];
    await setGroups(userId, updatedGroups);
    groupsAtom.set(updatedGroups);

    return newGroup;
  },
  "data.createGroup",
);

/**
 * Update an existing group
 */
export const updateGroup = action(
  async (id: string, input: UpdateGroupInput) => {
    const groups = groupsAtom();
    const group = groups.find((g) => g.id === id);
    if (!group) throw new Error("Group not found");

    const updatedGroup = { ...group, ...input, ...updateTimestamp() };
    const updatedGroups = groups.map((g) => (g.id === id ? updatedGroup : g));

    await setGroups(group.userId, updatedGroups);
    groupsAtom.set(updatedGroups);
  },
  "data.updateGroup",
);

/**
 * Delete a group (soft or hard delete)
 */
export const deleteGroup = action(
  async (userId: string, id: string, hard = false) => {
    const groups = groupsAtom();
    const bookmarks = bookmarksAtom();

    if (hard) {
      const updatedGroups = groups.filter((g) => g.id !== id);
      const updatedBookmarks = bookmarks.filter((b) => b.groupId !== id);

      await Promise.all([
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ]);

      groupsAtom.set(updatedGroups);
      bookmarksAtom.set(updatedBookmarks);
    } else {
      const updatedGroups = groups.map((g) =>
        g.id === id ? { ...g, isArchived: true, ...updateTimestamp() } : g,
      );
      const updatedBookmarks = bookmarks.map((b) =>
        b.groupId === id ? { ...b, isArchived: true, ...updateTimestamp() } : b,
      );

      await Promise.all([
        setGroups(userId, updatedGroups),
        setBookmarks(userId, updatedBookmarks),
      ]);

      groupsAtom.set(updatedGroups.filter((g) => !g.isArchived));
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteGroup",
);

/**
 * Reorder groups within a space
 */
export const reorderGroups = action(
  async (userId: string, spaceId: string, orderedIds: string[]) => {
    const groups = groupsAtom();
    const otherGroups = groups.filter((g) => g.spaceId !== spaceId);
    const reorderedGroups = orderedIds.map((id, index) => {
      const group = groups.find((g) => g.id === id)!;
      return { ...group, order: index, ...updateTimestamp() };
    });

    const updatedGroups = [...otherGroups, ...reorderedGroups];
    await setGroups(userId, updatedGroups);
    groupsAtom.set(updatedGroups);
  },
  "data.reorderGroups",
);

// ============================================
// Bookmark CRUD
// ============================================

/**
 * Create a new bookmark
 */
export const createBookmark = action(
  async (userId: string, input: CreateBookmarkInput) => {
    const groups = groupsAtom();
    const bookmarks = bookmarksAtom();
    const group = groups.find((g) => g.id === input.groupId);
    if (!group) throw new Error("Group not found");

    const groupBookmarks = bookmarks.filter((b) => b.groupId === input.groupId);

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
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    await setBookmarks(userId, updatedBookmarks);
    bookmarksAtom.set(updatedBookmarks);

    return newBookmark;
  },
  "data.createBookmark",
);

/**
 * Update an existing bookmark
 */
export const updateBookmark = action(
  async (id: string, input: UpdateBookmarkInput) => {
    const bookmarks = bookmarksAtom();
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark) throw new Error("Bookmark not found");

    const updatedBookmark = { ...bookmark, ...input, ...updateTimestamp() };
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === id ? updatedBookmark : b,
    );

    await setBookmarks(bookmark.userId, updatedBookmarks);
    bookmarksAtom.set(updatedBookmarks);
  },
  "data.updateBookmark",
);

/**
 * Delete a bookmark (soft or hard delete)
 */
export const deleteBookmark = action(
  async (userId: string, id: string, hard = false) => {
    const bookmarks = bookmarksAtom();

    if (hard) {
      const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
      await setBookmarks(userId, updatedBookmarks);
      bookmarksAtom.set(updatedBookmarks);
    } else {
      const updatedBookmarks = bookmarks.map((b) =>
        b.id === id ? { ...b, isArchived: true, ...updateTimestamp() } : b,
      );
      await setBookmarks(userId, updatedBookmarks);
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteBookmark",
);

/**
 * Reorder bookmarks within a group
 */
export const reorderBookmarks = action(
  async (userId: string, groupId: string, orderedIds: string[]) => {
    const bookmarks = bookmarksAtom();
    const otherBookmarks = bookmarks.filter((b) => b.groupId !== groupId);
    const reorderedBookmarks = orderedIds.map((id, index) => {
      const bookmark = bookmarks.find((b) => b.id === id)!;
      return { ...bookmark, order: index, ...updateTimestamp() };
    });

    const updatedBookmarks = [...otherBookmarks, ...reorderedBookmarks];
    await setBookmarks(userId, updatedBookmarks);
    bookmarksAtom.set(updatedBookmarks);
  },
  "data.reorderBookmarks",
);
