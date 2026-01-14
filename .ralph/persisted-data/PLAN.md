# IndexedDB Persistence for Bookmarks Extension

Add IndexedDB persistence layer using `idb_kval` to enable instant page loads (no spinners), offline capability, and automatic cache-first loading with server sync via Reatom's persist system and lifecycle hooks.

---

## Phase 1: Install idb_kval Package

**Goal**: Add the `idb_kval` dependency to the project.

### Tasks

- [ ] Task 1: Run `bun add idb_kval` to install the package
- [ ] Task 2: Verify `idb_kval` appears in `package.json` dependencies

### Success Criteria

- `package.json` contains `"idb_kval"` in dependencies
- `bun install` completes without errors

---

## Phase 2: Create IndexedDB Storage Adapter

**Goal**: Create a custom Reatom persist storage adapter that uses IndexedDB via `idb_kval`.

### Tasks

- [ ] Task 1: Create new file `src/lib/indexeddb-storage.ts`
- [ ] Task 2: Import `reatomPersist` and `createMemStorage` from `@reatom/core/persist`
- [ ] Task 3: Import storage functions from `idb_kval` (likely `get`, `set`, `del` from a custom store)
- [ ] Task 4: Define constants:
  - `DB_NAME = 'bookmarks-index-storage'`
  - `STORAGE_NAMESPACE = 'bookmarks-index:'`
- [ ] Task 5: Implement `createIndexedDBStorage()` function returning `PersistStorage` interface:
  - `name`: `'indexeddb-storage'`
  - `cache`: Use `createMemStorage({ name: 'indexeddb-fallback' }).cache`
  - `get({ key })`: Try `idb.get()`, catch errors and return `null`, log warning
  - `set({ key }, record)`: Try `idb.set()`, catch errors silently, log warning
  - `clear({ key })`: Try `idb.del()`, catch errors silently, log warning
- [ ] Task 6: Helper function `getStorageKey(key: string)` returns `${STORAGE_NAMESPACE}${key}`
- [ ] Task 7: Export `withIndexedDBStorage = reatomPersist(createIndexedDBStorage())`

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- File `src/lib/indexeddb-storage.ts` exports `withIndexedDBStorage`
- File `src/lib/indexeddb-storage.ts` exports `createIndexedDBStorage`

---

## Phase 3: Create Serialization Helper for Atom Arrays

**Goal**: Create a reusable helper that configures persistence with custom serialization for arrays of atoms.

### Tasks

- [ ] Task 1: Create new file `src/lib/storage-serializers.ts`
- [ ] Task 2: Import `atom` and `type Atom` from `@reatom/core`
- [ ] Task 3: Import `withIndexedDBStorage` from `@/lib/indexeddb-storage`
- [ ] Task 4: Create and export `persistEntityArray<T>(key: string)` function that returns:
  ```typescript
  withIndexedDBStorage({
    key,
    toSnapshot: (atoms: Atom<T>[]) => atoms.map((a) => a()),
    fromSnapshot: (snapshot: T[]) => snapshot.map((entity) => atom(entity)),
    version: 1
  })
  ```

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- File `src/lib/storage-serializers.ts` exports `persistEntityArray`

---

## Phase 4: Update Spaces Model with Persistence

**Goal**: Apply IndexedDB persistence and lifecycle hooks to `spacesAtom`.

### Tasks

- [ ] Task 1: In `src/domain/spaces/spaces.model.ts`, add import `withConnectHook` from `@reatom/core`
- [ ] Task 2: Add import `persistEntityArray` from `@/lib/storage-serializers`
- [ ] Task 3: Keep the existing `loadSpaces` action as-is (already defined and exported)
- [ ] Task 4: Modify `spacesAtom` definition to add extensions:
  ```typescript
  export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom')
    .extend(persistEntityArray<Space>('spaces'))
    .extend(withConnectHook(loadSpaces))
  ```
- [ ] Task 5: Ensure `loadSpaces` action is defined BEFORE `spacesAtom` (dependency order)
- [ ] Task 6: Keep all CRUD actions unchanged (they already call `spacesAtom.set()` which auto-persists)

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- `spacesAtom` has `.extend(persistEntityArray(...))` and `.extend(withConnectHook(...))`
- `loadSpaces` action is defined before `spacesAtom`

---

## Phase 5: Update Groups Model with Persistence

**Goal**: Apply IndexedDB persistence and lifecycle hooks to `groupsAtom`.

### Tasks

- [ ] Task 1: In `src/domain/groups/groups.model.ts`, add import `withConnectHook` from `@reatom/core`
- [ ] Task 2: Add import `persistEntityArray` from `@/lib/storage-serializers`
- [ ] Task 3: Keep the existing `loadGroups` action as-is (already defined and exported)
- [ ] Task 4: Modify `groupsAtom` definition to add extensions:
  ```typescript
  export const groupsAtom = atom<Atom<Group>[]>([], 'groups.atom')
    .extend(persistEntityArray<Group>('groups'))
    .extend(withConnectHook(loadGroups))
  ```
- [ ] Task 5: Ensure `loadGroups` action is defined BEFORE `groupsAtom` (dependency order)
- [ ] Task 6: Keep all CRUD actions unchanged

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- `groupsAtom` has `.extend(persistEntityArray(...))` and `.extend(withConnectHook(...))`
- `loadGroups` action is defined before `groupsAtom`

---

## Phase 6: Update Bookmarks Model with Persistence

**Goal**: Apply IndexedDB persistence and lifecycle hooks to `bookmarksAtom`.

### Tasks

- [ ] Task 1: In `src/domain/bookmarks/bookmarks.model.ts`, add import `withConnectHook` from `@reatom/core`
- [ ] Task 2: Add import `persistEntityArray` from `@/lib/storage-serializers`
- [ ] Task 3: Keep the existing `loadBookmarks` action as-is (already defined and exported)
- [ ] Task 4: Modify `bookmarksAtom` definition to add extensions:
  ```typescript
  export const bookmarksAtom = atom<Atom<Bookmark>[]>([], 'bookmarks.atom')
    .extend(persistEntityArray<Bookmark>('bookmarks'))
    .extend(withConnectHook(loadBookmarks))
  ```
- [ ] Task 5: Ensure `loadBookmarks` action is defined BEFORE `bookmarksAtom` (dependency order)
- [ ] Task 6: Keep all CRUD actions unchanged

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- `bookmarksAtom` has `.extend(persistEntityArray(...))` and `.extend(withConnectHook(...))`
- `loadBookmarks` action is defined before `bookmarksAtom`

---

## Phase 7: Remove Explicit Load Calls from Auth Flow

**Goal**: Remove manual calls to load actions since lifecycle hooks now handle loading automatically.

### Tasks

- [ ] Task 1: Search for explicit load calls using `rg "loadSpaces\(|loadGroups\(|loadBookmarks\(" src/`
- [ ] Task 2: Check `src/stores/auth/data-atoms.ts` for load calls
- [ ] Task 3: Check any component files that might call load actions directly
- [ ] Task 4: Remove or comment out explicit `loadSpaces()`, `loadGroups()`, `loadBookmarks()` calls
- [ ] Task 5: Components should only subscribe to atoms via `reatomComponent()` - lifecycle handles the rest

### Success Criteria

- TypeScript compilation succeeds (`bun run tsc`)
- No explicit `loadSpaces()`, `loadGroups()`, `loadBookmarks()` calls remain in component code
- Load actions are still exported (may be needed for future manual refresh)

---

## Phase 8: Run Linting and Type Checks

**Goal**: Ensure code quality and fix any issues.

### Tasks

- [ ] Task 1: Run `bun run tsc` to check for type errors
- [ ] Task 2: Run `bun run lint` to check for linting issues
- [ ] Task 3: Run `bun run lint:fix` to auto-fix linting issues
- [ ] Task 4: Run `bun run format` to format code with Prettier
- [ ] Task 5: Run `bun run tsc` again to verify no new errors introduced

### Success Criteria

- `bun run tsc` exits with code 0 (no type errors)
- `bun run lint` exits with code 0 (no lint errors)
- `bun run format:check` exits with code 0 (properly formatted)

---

## Phase 9: Verify Import Order and Conventions

**Goal**: Ensure all new/modified files follow AGENTS.md conventions.

### Tasks

- [ ] Task 1: In `src/lib/indexeddb-storage.ts`, verify import order:
  1. External packages (`@reatom/core/persist`, `idb_kval`)
  2. No internal imports needed
- [ ] Task 2: In `src/lib/storage-serializers.ts`, verify import order:
  1. External packages (`@reatom/core`)
  2. Internal aliases (`@/lib/indexeddb-storage`)
- [ ] Task 3: In all three model files, verify import order:
  1. External packages (`@reatom/core`)
  2. Internal aliases (`@/api`, `@/stores/...`, `@/lib/...`, `@/domain/...`)
  3. Relative type imports (`./spaces.types`)
- [ ] Task 4: Verify all imports use `@/` aliases, not relative paths like `../../`
- [ ] Task 5: Verify naming conventions:
  - Functions: camelCase (`createIndexedDBStorage`, `persistEntityArray`)
  - Constants: UPPER_SNAKE (`DB_NAME`, `STORAGE_NAMESPACE`)
  - Types: PascalCase

### Success Criteria

- All files follow import order from AGENTS.md
- All internal imports use `@/` path aliases
- Naming conventions match AGENTS.md guidelines

---

## Phase 10: Build Verification

**Goal**: Verify the extension builds successfully for production.

### Tasks

- [ ] Task 1: Run `bun run build` to build for Chrome
- [ ] Task 2: Verify build completes without errors
- [ ] Task 3: Check that output exists in `build/` directory

### Success Criteria

- `bun run build` exits with code 0
- Build output directory contains extension files

---

## Context for Implementation

### Architecture Overview

**Storage Flow:**

1. App starts → `spacesAtom` loads from IndexedDB cache (instant)
2. Component mounts → subscribes to `spacesAtom` → `withConnectHook` triggers `loadSpaces`
3. Server responds → `spacesAtom.set()` updates atom
4. Persist layer → automatically saves to IndexedDB
5. Next page load → cached data loads instantly

**Key Reatom Patterns:**

```typescript
// withConnectHook triggers action when first subscriber connects
export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom')
  .extend(persistEntityArray<Space>('spaces')) // Load from IndexedDB on init
  .extend(withConnectHook(loadSpaces)) // Fetch from server on connect
```

**Serialization:**

- Storage stores plain objects: `Space[]`
- Atoms store wrapped objects: `Atom<Space>[]`
- `toSnapshot`: unwrap atoms for storage
- `fromSnapshot`: re-wrap as atoms on load

**Error Handling:**

- All IndexedDB operations wrapped in try/catch
- On error: log warning, return null, don't throw
- App continues in server-only mode if storage fails

### Storage Schema

```
IndexedDB database: 'bookmarks-index-storage'
Keys:
  - 'bookmarks-index:spaces'    → Space[]
  - 'bookmarks-index:groups'    → Group[]
  - 'bookmarks-index:bookmarks' → Bookmark[]
```

### File Structure

```
src/lib/
├── indexeddb-storage.ts    # NEW: IndexedDB adapter
└── storage-serializers.ts  # NEW: Atom array serialization

src/domain/
├── spaces/spaces.model.ts     # MODIFY: Add persistence
├── groups/groups.model.ts     # MODIFY: Add persistence
└── bookmarks/bookmarks.model.ts # MODIFY: Add persistence
```

### Dependencies

- `idb_kval`: Simple IndexedDB key-value storage
- `@reatom/core`: Already installed (v1000)
- `@reatom/core/persist`: Part of @reatom/core package

### References

- Reatom Persistence: https://v1000.reatom.dev/handbook/persist/
- Reatom Lifecycle: https://v1000.reatom.dev/handbook/lifecycle/
- idb-keyval (similar API): https://github.com/jakearchibald/idb-keyval
