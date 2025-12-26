# Zustand to Reatom Migration Plan

## Overview

This plan outlines the migration from **Zustand** to **Reatom** for the bookmarks-index project. The migration will preserve all existing functionality while leveraging Reatom's atomic state management, automatic dependency tracking, and better async handling.

### Current State (Zustand)

**3 Stores:**

1. `auth-store.ts` (141 lines) - user, isAuthenticated, isLoading, isInitialized + initialize(), login(), logout(), updateSettings()
2. `data-store.ts` (391 lines) - spaces[], groups[], bookmarks[], isLoading + loadAllData() + CRUD for each entity + reorder operations
3. `ui-store.ts` (109 lines) - activeSpaceId, selectedGroupId, modalType, modalEntity, theme + navigation/modal/theme actions

**4 Hooks:**

1. `use-spaces.ts` - useSpaces(), useActiveSpace(), useSpaceActions()
2. `use-groups.ts` - useGroups(spaceId), useSelectedGroup(), useGroupActions()
3. `use-bookmarks.ts` - useBookmarks(groupId), useBookmarkActions()
4. `use-theme.ts` - useTheme()

### Key Migration Considerations

1. **Async operations**: All CRUD operations use async IndexedDB - must use `wrap()` for context preservation
2. **Computed values**: getGroupsBySpace, getBookmarksByGroup → convert to `computed()`
3. **Persistence**: Theme uses localStorage, data uses IndexedDB via idb-keyval
4. **Side effects**: Theme applies CSS class to document.documentElement
5. **Cross-component dependencies**: Hooks access multiple stores (e.g., useSpaceActions needs auth + data + ui)
6. **Component patterns**: Currently use `useStore(selector)` pattern, migrate to `reatomComponent` where beneficial

---

## Phase 1: Setup & Configuration

### 1.1 Install Dependencies

```bash
bun add @reatom/core @reatom/react
bun remove zustand
```

### 1.2 Create Reatom Context Provider

**File:** `src/main.tsx`

```tsx
import { context, connectLogger, clearStack } from "@reatom/core";
import { reatomContext } from "@reatom/react";

// Optional: Disable default context for predictability
clearStack();

const rootFrame = context.start();
if (import.meta.env.DEV) {
  rootFrame.run(connectLogger);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <reatomContext.Provider value={rootFrame}>
      <App />
    </reatomContext.Provider>
  </StrictMode>,
);
```

### 1.3 Create New Store Structure

```
src/stores/
├── auth/
│   ├── atoms.ts       # user, isAuthenticated, isLoading, isInitialized
│   └── actions.ts     # initialize, login, logout, updateSettings
├── data/
│   ├── atoms.ts       # spaces, groups, bookmarks arrays
│   ├── computed.ts    # getGroupsBySpace, getBookmarksByGroup
│   └── actions.ts     # CRUD + reorder operations
├── ui/
│   ├── atoms.ts       # activeSpaceId, selectedGroupId, theme, modal
│   └── actions.ts     # navigation, modal, theme actions
└── index.ts           # Re-exports for convenience
```

---

## Phase 2: Auth Module Migration

### 2.1 Auth Atoms

**File:** `src/stores/auth/atoms.ts`

```typescript
import { atom, computed } from "@reatom/core";
import type { User } from "@/types";

// Core auth state
export const userAtom = atom<User | null>(null, "auth.user");
export const isLoadingAtom = atom(false, "auth.isLoading");
export const isInitializedAtom = atom(false, "auth.isInitialized");

// Computed auth state
export const isAuthenticatedAtom = computed(
  () => userAtom() !== null,
  "auth.isAuthenticated",
);
```

### 2.2 Auth Actions

**File:** `src/stores/auth/actions.ts`

```typescript
import { action, wrap } from "@reatom/core";
import { userAtom, isLoadingAtom, isInitializedAtom } from "./atoms";
import {
  getCurrentUserId,
  setCurrentUserId,
  clearCurrentUserId,
  getUser,
  setUser,
} from "@/lib/storage/idb";
import { createTimestamps } from "@/lib/utils/entity";
import type { User, UserSettings } from "@/types";

export const initializeAuth = action(async () => {
  if (isInitializedAtom()) return;

  isLoadingAtom.set(true);

  try {
    const currentUserId = await wrap(getCurrentUserId());

    if (currentUserId) {
      const user = await wrap(getUser(currentUserId));
      if (user) {
        userAtom.set(user);
      }
    }
  } catch (error) {
    console.error("Failed to initialize auth:", error);
  } finally {
    isLoadingAtom.set(false);
    isInitializedAtom.set(true);
  }
}, "auth.initialize");

export const login = action(async (username: string) => {
  isLoadingAtom.set(true);

  try {
    const userId = `user_${username.toLowerCase()}`;
    let user = await wrap(getUser(userId));

    if (!user) {
      user = {
        id: userId,
        username,
        settings: { theme: "system" },
        ...createTimestamps(),
      };
      await wrap(setUser(user));
    }

    await wrap(setCurrentUserId(userId));
    userAtom.set(user);
  } catch (error) {
    console.error("Failed to login:", error);
    throw error;
  } finally {
    isLoadingAtom.set(false);
  }
}, "auth.login");

export const logout = action(async () => {
  isLoadingAtom.set(true);

  try {
    await wrap(clearCurrentUserId());
    userAtom.set(null);
  } catch (error) {
    console.error("Failed to logout:", error);
    throw error;
  } finally {
    isLoadingAtom.set(false);
  }
}, "auth.logout");

export const updateSettings = action(
  async (newSettings: Partial<UserSettings>) => {
    const user = userAtom();
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        settings: { ...user.settings, ...newSettings },
        updatedAt: new Date().toISOString(),
      };

      await wrap(setUser(updatedUser));
      userAtom.set(updatedUser);
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  },
  "auth.updateSettings",
);
```

---

## Phase 3: UI Module Migration

### 3.1 UI Atoms

**File:** `src/stores/ui/atoms.ts`

```typescript
import { atom, effect, withLocalStorage } from "@reatom/core";
import type { ModalType, Space, Group, Bookmark } from "@/types";

type Theme = "light" | "dark" | "system";

// Navigation state
export const activeSpaceIdAtom = atom<string | null>(null, "ui.activeSpaceId");
export const selectedGroupIdAtom = atom<string | null>(
  null,
  "ui.selectedGroupId",
);

// Modal state
export const modalTypeAtom = atom<ModalType>(null, "ui.modalType");
export const modalEntityAtom = atom<Space | Group | Bookmark | null>(
  null,
  "ui.modalEntity",
);

// Theme with localStorage persistence
export const themeAtom = atom<Theme>("system", "ui.theme").extend(
  withLocalStorage("bookmarks-index-theme"),
);

// Effect to apply theme to document
effect(() => {
  const theme = themeAtom();
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  }
});
```

### 3.2 UI Actions

**File:** `src/stores/ui/actions.ts`

```typescript
import { action } from "@reatom/core";
import {
  activeSpaceIdAtom,
  selectedGroupIdAtom,
  modalTypeAtom,
  modalEntityAtom,
  themeAtom,
} from "./atoms";
import type { ModalType, Space, Group, Bookmark } from "@/types";

type Theme = "light" | "dark" | "system";

// Navigation actions
export const setActiveSpace = action((spaceId: string | null) => {
  activeSpaceIdAtom.set(spaceId);
  selectedGroupIdAtom.set(null); // Reset group when space changes
}, "ui.setActiveSpace");

export const setSelectedGroup = action((groupId: string | null) => {
  selectedGroupIdAtom.set(groupId);
}, "ui.setSelectedGroup");

// Modal actions
export const openModal = action(
  (type: ModalType, entity?: Space | Group | Bookmark) => {
    modalTypeAtom.set(type);
    modalEntityAtom.set(entity ?? null);
  },
  "ui.openModal",
);

export const closeModal = action(() => {
  modalTypeAtom.set(null);
  modalEntityAtom.set(null);
}, "ui.closeModal");

// Theme actions
export const setTheme = action((theme: Theme) => {
  themeAtom.set(theme);
}, "ui.setTheme");
```

---

## Phase 4: Data Module Migration

### 4.1 Data Atoms

**File:** `src/stores/data/atoms.ts`

```typescript
import { atom } from "@reatom/core";
import type { Space, Group, Bookmark } from "@/types";

// Entity arrays
export const spacesAtom = atom<Space[]>([], "data.spaces");
export const groupsAtom = atom<Group[]>([], "data.groups");
export const bookmarksAtom = atom<Bookmark[]>([], "data.bookmarks");

// Loading state
export const isDataLoadingAtom = atom(false, "data.isLoading");
```

### 4.2 Computed Values

**File:** `src/stores/data/computed.ts`

```typescript
import { computed } from "@reatom/core";
import { spacesAtom, groupsAtom, bookmarksAtom } from "./atoms";

// Get space by ID
export const getSpaceById = (id: string) =>
  computed(() => spacesAtom().find((s) => s.id === id), `data.spaceById.${id}`);

// Get groups by space ID (sorted by order)
export const getGroupsBySpaceId = (spaceId: string) =>
  computed(
    () =>
      groupsAtom()
        .filter((g) => g.spaceId === spaceId)
        .sort((a, b) => a.order - b.order),
    `data.groupsBySpace.${spaceId}`,
  );

// Get bookmarks by group ID (sorted by order)
export const getBookmarksByGroupId = (groupId: string) =>
  computed(
    () =>
      bookmarksAtom()
        .filter((b) => b.groupId === groupId)
        .sort((a, b) => a.order - b.order),
    `data.bookmarksByGroup.${groupId}`,
  );

// Sorted spaces
export const sortedSpaces = computed(
  () => spacesAtom().sort((a, b) => a.order - b.order),
  "data.sortedSpaces",
);
```

### 4.3 Data Actions

**File:** `src/stores/data/actions.ts`

```typescript
import { action, wrap } from "@reatom/core";
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

// Load all data for a user
export const loadAllData = action(async (userId: string) => {
  isDataLoadingAtom.set(true);

  try {
    let [spaces, groups, bookmarks] = await wrap(
      Promise.all([getSpaces(userId), getGroups(userId), getBookmarks(userId)]),
    );

    // Seed if empty
    if (spaces.length === 0) {
      const seedData = createSeedData(userId);
      spaces = seedData.spaces;
      groups = seedData.groups;
      bookmarks = seedData.bookmarks;

      await wrap(
        Promise.all([
          setSpaces(userId, spaces),
          setGroups(userId, groups),
          setBookmarks(userId, bookmarks),
        ]),
      );
    }

    // Set state (filtered for non-archived)
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

// ============================================
// Space CRUD
// ============================================

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
    await wrap(setSpaces(userId, updatedSpaces));
    spacesAtom.set(updatedSpaces);

    return newSpace;
  },
  "data.createSpace",
);

export const updateSpace = action(
  async (id: string, input: UpdateSpaceInput) => {
    const spaces = spacesAtom();
    const space = spaces.find((s) => s.id === id);
    if (!space) throw new Error("Space not found");

    const updatedSpace = { ...space, ...input, ...updateTimestamp() };
    const updatedSpaces = spaces.map((s) => (s.id === id ? updatedSpace : s));

    await wrap(setSpaces(space.userId, updatedSpaces));
    spacesAtom.set(updatedSpaces);
  },
  "data.updateSpace",
);

export const deleteSpace = action(
  async (userId: string, id: string, hard = false) => {
    const spaces = spacesAtom();
    const groups = groupsAtom();
    const bookmarks = bookmarksAtom();

    if (hard) {
      const updatedSpaces = spaces.filter((s) => s.id !== id);
      const updatedGroups = groups.filter((g) => g.spaceId !== id);
      const groupIds = groups.filter((g) => g.spaceId === id).map((g) => g.id);
      const updatedBookmarks = bookmarks.filter(
        (b) => !groupIds.includes(b.groupId),
      );

      await wrap(
        Promise.all([
          setSpaces(userId, updatedSpaces),
          setGroups(userId, updatedGroups),
          setBookmarks(userId, updatedBookmarks),
        ]),
      );

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

      await wrap(
        Promise.all([
          setSpaces(userId, updatedSpaces),
          setGroups(userId, updatedGroups),
          setBookmarks(userId, updatedBookmarks),
        ]),
      );

      spacesAtom.set(updatedSpaces.filter((s) => !s.isArchived));
      groupsAtom.set(updatedGroups.filter((g) => !g.isArchived));
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteSpace",
);

export const reorderSpaces = action(
  async (userId: string, orderedIds: string[]) => {
    const spaces = spacesAtom();
    const updatedSpaces = orderedIds.map((id, index) => {
      const space = spaces.find((s) => s.id === id)!;
      return { ...space, order: index, ...updateTimestamp() };
    });

    await wrap(setSpaces(userId, updatedSpaces));
    spacesAtom.set(updatedSpaces);
  },
  "data.reorderSpaces",
);

// ============================================
// Group CRUD
// ============================================

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
    await wrap(setGroups(userId, updatedGroups));
    groupsAtom.set(updatedGroups);

    return newGroup;
  },
  "data.createGroup",
);

export const updateGroup = action(
  async (id: string, input: UpdateGroupInput) => {
    const groups = groupsAtom();
    const group = groups.find((g) => g.id === id);
    if (!group) throw new Error("Group not found");

    const updatedGroup = { ...group, ...input, ...updateTimestamp() };
    const updatedGroups = groups.map((g) => (g.id === id ? updatedGroup : g));

    await wrap(setGroups(group.userId, updatedGroups));
    groupsAtom.set(updatedGroups);
  },
  "data.updateGroup",
);

export const deleteGroup = action(
  async (userId: string, id: string, hard = false) => {
    const groups = groupsAtom();
    const bookmarks = bookmarksAtom();

    if (hard) {
      const updatedGroups = groups.filter((g) => g.id !== id);
      const updatedBookmarks = bookmarks.filter((b) => b.groupId !== id);

      await wrap(
        Promise.all([
          setGroups(userId, updatedGroups),
          setBookmarks(userId, updatedBookmarks),
        ]),
      );

      groupsAtom.set(updatedGroups);
      bookmarksAtom.set(updatedBookmarks);
    } else {
      const updatedGroups = groups.map((g) =>
        g.id === id ? { ...g, isArchived: true, ...updateTimestamp() } : g,
      );
      const updatedBookmarks = bookmarks.map((b) =>
        b.groupId === id ? { ...b, isArchived: true, ...updateTimestamp() } : b,
      );

      await wrap(
        Promise.all([
          setGroups(userId, updatedGroups),
          setBookmarks(userId, updatedBookmarks),
        ]),
      );

      groupsAtom.set(updatedGroups.filter((g) => !g.isArchived));
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteGroup",
);

export const reorderGroups = action(
  async (userId: string, spaceId: string, orderedIds: string[]) => {
    const groups = groupsAtom();
    const otherGroups = groups.filter((g) => g.spaceId !== spaceId);
    const reorderedGroups = orderedIds.map((id, index) => {
      const group = groups.find((g) => g.id === id)!;
      return { ...group, order: index, ...updateTimestamp() };
    });

    const updatedGroups = [...otherGroups, ...reorderedGroups];
    await wrap(setGroups(userId, updatedGroups));
    groupsAtom.set(updatedGroups);
  },
  "data.reorderGroups",
);

// ============================================
// Bookmark CRUD
// ============================================

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
    await wrap(setBookmarks(userId, updatedBookmarks));
    bookmarksAtom.set(updatedBookmarks);

    return newBookmark;
  },
  "data.createBookmark",
);

export const updateBookmark = action(
  async (id: string, input: UpdateBookmarkInput) => {
    const bookmarks = bookmarksAtom();
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark) throw new Error("Bookmark not found");

    const updatedBookmark = { ...bookmark, ...input, ...updateTimestamp() };
    const updatedBookmarks = bookmarks.map((b) =>
      b.id === id ? updatedBookmark : b,
    );

    await wrap(setBookmarks(bookmark.userId, updatedBookmarks));
    bookmarksAtom.set(updatedBookmarks);
  },
  "data.updateBookmark",
);

export const deleteBookmark = action(
  async (userId: string, id: string, hard = false) => {
    const bookmarks = bookmarksAtom();

    if (hard) {
      const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
      await wrap(setBookmarks(userId, updatedBookmarks));
      bookmarksAtom.set(updatedBookmarks);
    } else {
      const updatedBookmarks = bookmarks.map((b) =>
        b.id === id ? { ...b, isArchived: true, ...updateTimestamp() } : b,
      );
      await wrap(setBookmarks(userId, updatedBookmarks));
      bookmarksAtom.set(updatedBookmarks.filter((b) => !b.isArchived));
    }
  },
  "data.deleteBookmark",
);

export const reorderBookmarks = action(
  async (userId: string, groupId: string, orderedIds: string[]) => {
    const bookmarks = bookmarksAtom();
    const otherBookmarks = bookmarks.filter((b) => b.groupId !== groupId);
    const reorderedBookmarks = orderedIds.map((id, index) => {
      const bookmark = bookmarks.find((b) => b.id === id)!;
      return { ...bookmark, order: index, ...updateTimestamp() };
    });

    const updatedBookmarks = [...otherBookmarks, ...reorderedBookmarks];
    await wrap(setBookmarks(userId, updatedBookmarks));
    bookmarksAtom.set(updatedBookmarks);
  },
  "data.reorderBookmarks",
);
```

---

## Phase 5: Hooks Layer Migration

### 5.1 use-spaces.ts

**File:** `src/hooks/use-spaces.ts`

```typescript
import { sortedSpaces, getSpaceById } from "@/stores/data/computed";
import { activeSpaceIdAtom } from "@/stores/ui/atoms";
import { userAtom } from "@/stores/auth/atoms";
import {
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces,
} from "@/stores/data/actions";
import { setActiveSpace } from "@/stores/ui/actions";
import type { CreateSpaceInput, UpdateSpaceInput } from "@/types";

/**
 * useSpaces - Returns all non-archived spaces (sorted)
 */
export function useSpaces() {
  return sortedSpaces();
}

/**
 * useActiveSpace - Returns the currently active space
 */
export function useActiveSpace() {
  const activeSpaceId = activeSpaceIdAtom();
  if (!activeSpaceId) return undefined;
  return getSpaceById(activeSpaceId)();
}

/**
 * useSpaceActions - Returns CRUD actions for spaces
 */
export function useSpaceActions() {
  const user = userAtom();

  return {
    createSpace: async (input: CreateSpaceInput) => {
      if (!user) throw new Error("User not authenticated");
      return createSpace(user.id, input);
    },
    updateSpace: async (id: string, input: UpdateSpaceInput) => {
      return updateSpace(id, input);
    },
    deleteSpace: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated");
      return deleteSpace(user.id, id, hard);
    },
    reorderSpaces: async (orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated");
      return reorderSpaces(user.id, orderedIds);
    },
    setActiveSpace: (spaceId: string | null) => setActiveSpace(spaceId),
  };
}
```

### 5.2 use-groups.ts

**File:** `src/hooks/use-groups.ts`

```typescript
import { groupsAtom } from "@/stores/data/atoms";
import { getGroupsBySpaceId } from "@/stores/data/computed";
import { selectedGroupIdAtom } from "@/stores/ui/atoms";
import { userAtom } from "@/stores/auth/atoms";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} from "@/stores/data/actions";
import { setSelectedGroup } from "@/stores/ui/actions";
import type { CreateGroupInput, UpdateGroupInput } from "@/types";

/**
 * useGroups - Returns groups for a specific space
 */
export function useGroups(spaceId: string | null) {
  if (!spaceId) return [];
  return getGroupsBySpaceId(spaceId)();
}

/**
 * useSelectedGroup - Returns the currently selected group
 */
export function useSelectedGroup() {
  const selectedGroupId = selectedGroupIdAtom();
  const groups = groupsAtom();

  return selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)
    : undefined;
}

/**
 * useGroupActions - Returns CRUD actions for groups
 */
export function useGroupActions() {
  const user = userAtom();

  return {
    createGroup: async (input: CreateGroupInput) => {
      if (!user) throw new Error("User not authenticated");
      return createGroup(user.id, input);
    },
    updateGroup: async (id: string, input: UpdateGroupInput) => {
      return updateGroup(id, input);
    },
    deleteGroup: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated");
      return deleteGroup(user.id, id, hard);
    },
    reorderGroups: async (spaceId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated");
      return reorderGroups(user.id, spaceId, orderedIds);
    },
    setSelectedGroup: (groupId: string | null) => setSelectedGroup(groupId),
  };
}
```

### 5.3 use-bookmarks.ts

**File:** `src/hooks/use-bookmarks.ts`

```typescript
import { getBookmarksByGroupId } from "@/stores/data/computed";
import { userAtom } from "@/stores/auth/atoms";
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
} from "@/stores/data/actions";
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@/types";

/**
 * useBookmarks - Returns bookmarks for a specific group
 */
export function useBookmarks(groupId: string | null) {
  if (!groupId) return [];
  return getBookmarksByGroupId(groupId)();
}

/**
 * useBookmarkActions - Returns CRUD actions for bookmarks
 */
export function useBookmarkActions() {
  const user = userAtom();

  return {
    createBookmark: async (input: CreateBookmarkInput) => {
      if (!user) throw new Error("User not authenticated");
      return createBookmark(user.id, input);
    },
    updateBookmark: async (id: string, input: UpdateBookmarkInput) => {
      return updateBookmark(id, input);
    },
    deleteBookmark: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated");
      return deleteBookmark(user.id, id, hard);
    },
    reorderBookmarks: async (groupId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated");
      return reorderBookmarks(user.id, groupId, orderedIds);
    },
  };
}
```

### 5.4 use-theme.ts

**File:** `src/hooks/use-theme.ts`

```typescript
import { themeAtom } from "@/stores/ui/atoms";
import { setTheme } from "@/stores/ui/actions";

/**
 * useTheme - Hook for theme management
 */
export function useTheme() {
  const theme = themeAtom();

  return {
    theme,
    setTheme: (newTheme: "light" | "dark" | "system") => setTheme(newTheme),
  };
}
```

---

## Phase 6: Component Integration

### 6.1 Auth Guard Migration

**File:** `src/components/auth/auth-guard.tsx`

**Option A: Keep hooks-based approach (simpler migration)**

```tsx
import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  userAtom,
  isAuthenticatedAtom,
  isLoadingAtom,
  isInitializedAtom,
} from "@/stores/auth/atoms";
import { isDataLoadingAtom } from "@/stores/data/atoms";
import { initializeAuth } from "@/stores/auth/actions";
import { loadAllData } from "@/stores/data/actions";
import { LoginForm } from "./login-form";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = userAtom();
  const isAuthenticated = isAuthenticatedAtom();
  const isLoading = isLoadingAtom();
  const isInitialized = isInitializedAtom();
  const isDataLoading = isDataLoadingAtom();
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);

  // Initialize auth on mount
  React.useEffect(() => {
    initializeAuth();
  }, []);

  // Load user data when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user && !isDataLoaded) {
      loadAllData(user.id).then(() => {
        setIsDataLoaded(true);
      });
    }
  }, [isAuthenticated, user, isDataLoaded]);

  // Reset data loaded state on logout
  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsDataLoaded(false);
    }
  }, [isAuthenticated]);

  // Show loading during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show loading while data is being fetched
  if (isDataLoading || !isDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading your bookmarks...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Option B: Use reatomComponent (recommended for frequent updates)**

```tsx
import { reatomComponent } from "@reatom/react";
import { Loader2 } from "lucide-react";
import {
  userAtom,
  isAuthenticatedAtom,
  isLoadingAtom,
  isInitializedAtom,
} from "@/stores/auth/atoms";
import { isDataLoadingAtom } from "@/stores/data/atoms";
import { initializeAuth } from "@/stores/auth/actions";
import { loadAllData } from "@/stores/data/actions";
import { LoginForm } from "./login-form";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = reatomComponent<AuthGuardProps>(({ children }) => {
  const user = userAtom();
  const isAuthenticated = isAuthenticatedAtom();
  const isLoading = isLoadingAtom();
  const isInitialized = isInitializedAtom();
  const isDataLoading = isDataLoadingAtom();

  // ... rest of the component logic
});
```

### 6.2 NewTabPage Migration

**File:** `src/components/new-tab/index.tsx`

Convert to use `reatomComponent` and access atoms directly:

```tsx
import { reatomComponent } from "@reatom/react";
import { userAtom } from "@/stores/auth/atoms";
import { activeSpaceIdAtom, selectedGroupIdAtom } from "@/stores/ui/atoms";
import {
  sortedSpaces,
  getGroupsBySpaceId,
  getBookmarksByGroupId,
} from "@/stores/data/computed";
import { logout } from "@/stores/auth/actions";
import { setActiveSpace, setSelectedGroup } from "@/stores/ui/actions";
import { useSpaceActions } from "@/hooks/use-spaces";
import { useGroupActions } from "@/hooks/use-groups";
import { useBookmarkActions } from "@/hooks/use-bookmarks";
import { useTheme } from "@/hooks/use-theme";
// ... other imports

export const NewTabPage = reatomComponent(() => {
  // Auth state
  const user = userAtom();

  // UI state
  const activeSpaceId = activeSpaceIdAtom();
  const selectedGroupId = selectedGroupIdAtom();

  // Theme
  const { theme, setTheme } = useTheme();

  // Data (computed)
  const spaces = sortedSpaces();
  const groups = activeSpaceId ? getGroupsBySpaceId(activeSpaceId)() : [];
  const bookmarks = selectedGroupId
    ? getBookmarksByGroupId(selectedGroupId)()
    : [];

  // Actions
  const { createSpace, updateSpace, deleteSpace } = useSpaceActions();
  const { createGroup, updateGroup, deleteGroup } = useGroupActions();
  const { createBookmark, updateBookmark, deleteBookmark } =
    useBookmarkActions();

  // ... rest of component logic (same as before)
});
```

---

## Phase 7: Cleanup & Documentation

### 7.1 Remove Zustand

```bash
bun remove zustand
```

### 7.2 Delete Old Store Files

```bash
rm src/stores/auth-store.ts
rm src/stores/data-store.ts
rm src/stores/ui-store.ts
```

### 7.3 Create Store Index

**File:** `src/stores/index.ts`

```typescript
// Auth
export * from "./auth/atoms";
export * from "./auth/actions";

// Data
export * from "./data/atoms";
export * from "./data/computed";
export * from "./data/actions";

// UI
export * from "./ui/atoms";
export * from "./ui/actions";
```

### 7.4 Update AGENTS.md

Replace the State Management section with:

```markdown
## State Management (Reatom)

| Module | Purpose        | Key Atoms                                               |
| ------ | -------------- | ------------------------------------------------------- |
| `auth` | Authentication | `userAtom`, `isAuthenticatedAtom`, `isLoadingAtom`      |
| `data` | Entity CRUD    | `spacesAtom`, `groupsAtom`, `bookmarksAtom`             |
| `ui`   | UI state       | `activeSpaceIdAtom`, `selectedGroupIdAtom`, `themeAtom` |

### Store Structure
```

src/stores/
├── auth/
│ ├── atoms.ts # user, isAuthenticated, isLoading, isInitialized
│ └── actions.ts # initialize, login, logout, updateSettings
├── data/
│ ├── atoms.ts # spaces, groups, bookmarks arrays
│ ├── computed.ts # getGroupsBySpace, getBookmarksByGroup, sortedSpaces
│ └── actions.ts # CRUD + reorder operations
├── ui/
│ ├── atoms.ts # activeSpaceId, selectedGroupId, theme, modal
│ └── actions.ts # navigation, modal, theme actions
└── index.ts # Re-exports

````

### Patterns Used

- `atom()` for primitive/object state
- `computed()` for derived state with automatic dependency tracking
- `action()` for operations with side effects
- `effect()` for reactive side effects (theme application)
- `withLocalStorage()` for theme persistence
- `wrap()` for async operations to preserve context
- `reatomComponent()` for React integration with auto-tracking

### Hooks API

```typescript
// Spaces
const spaces = useSpaces()                    // Returns sorted spaces
const activeSpace = useActiveSpace()          // Returns active space or undefined
const { createSpace, updateSpace, ... } = useSpaceActions()

// Groups
const groups = useGroups(spaceId)             // Returns groups for space
const selectedGroup = useSelectedGroup()
const { createGroup, updateGroup, ... } = useGroupActions()

// Bookmarks
const bookmarks = useBookmarks(groupId)
const { createBookmark, updateBookmark, ... } = useBookmarkActions()

// Theme
const { theme, setTheme } = useTheme()
````

```

---

## Migration Checklist

### Pre-Migration
- [ ] Create git branch `feature/reatom-migration`
- [ ] Read Reatom documentation (`.ai/docs/reatom.md`)

### Phase 1: Setup
- [ ] Install `@reatom/core` and `@reatom/react`
- [ ] Configure Reatom context in `main.tsx`
- [ ] Create store directory structure

### Phase 2: Auth Module
- [ ] Create `src/stores/auth/atoms.ts`
- [ ] Create `src/stores/auth/actions.ts`
- [ ] Test auth flow works

### Phase 3: UI Module
- [ ] Create `src/stores/ui/atoms.ts` with theme persistence
- [ ] Create `src/stores/ui/actions.ts`
- [ ] Verify theme effect works

### Phase 4: Data Module
- [ ] Create `src/stores/data/atoms.ts`
- [ ] Create `src/stores/data/computed.ts`
- [ ] Create `src/stores/data/actions.ts` (all CRUD)
- [ ] Test data loading and CRUD operations

### Phase 5: Hooks
- [ ] Migrate `use-spaces.ts`
- [ ] Migrate `use-groups.ts`
- [ ] Migrate `use-bookmarks.ts`
- [ ] Migrate `use-theme.ts`

### Phase 6: Components
- [ ] Update `auth-guard.tsx`
- [ ] Update `login-form.tsx` (if needed)
- [ ] Update `new-tab/index.tsx`
- [ ] Update any other components using stores directly

### Phase 7: Cleanup
- [ ] Remove zustand from package.json
- [ ] Delete old store files (`auth-store.ts`, `data-store.ts`, `ui-store.ts`)
- [ ] Create `src/stores/index.ts`
- [ ] Update AGENTS.md
- [ ] Run full test (web app mode): `bun dev`
- [ ] Run full test (extension mode): `bun run build:extension`

---

## Key Differences Summary

| Aspect | Zustand | Reatom |
|--------|---------|--------|
| Store Pattern | Single store with slices | Multiple independent atoms |
| State Access | `useStore(selector)` | `reatomComponent()` + direct call or `useAtom()` |
| Actions | Inside store definition | Separate `action()` functions |
| Updates | `set(state => ...)` | `atom.set(prev => ...)` |
| Middleware | Zustand middleware | Extensions (`.extend()`) |
| Persistence | `persist` middleware | `withLocalStorage`, `withIndexedDb` |
| Async | Regular async/await | `wrap()` for context preservation |
| Derived State | Manual selectors | `computed()` with auto-tracking |

---

## Risk Mitigation

1. **Incremental Migration**: Can keep both Zustand and Reatom temporarily during migration
2. **Type Safety**: TypeScript will catch most issues at compile time
3. **Testing**: Test each phase independently before proceeding
4. **Rollback Plan**: Keep original files in git until migration is verified

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Setup | 30 min |
| Phase 2: Auth Module | 1 hour |
| Phase 3: UI Module | 45 min |
| Phase 4: Data Module | 2 hours |
| Phase 5: Hooks Layer | 1 hour |
| Phase 6: Component Integration | 1.5 hours |
| Phase 7: Cleanup | 30 min |
| **Total** | **~7-8 hours** |

---

## References

- Reatom Documentation: `.ai/docs/reatom.md`
- Current Zustand Stores: `src/stores/`
- Current Hooks: `src/hooks/`
```
