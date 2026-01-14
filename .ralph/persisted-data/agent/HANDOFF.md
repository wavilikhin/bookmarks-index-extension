# Phase 5 Handoff: Update Groups Model with Persistence

## What Was Done

- ✅ **Task 1**: Added import `withConnectHook` from `@reatom/core`
  - Import added to line 2 of groups.model.ts
- ✅ **Task 2**: Added import `persistEntityArray` from `@/lib/storage-serializers`
  - Import added to line 6 of groups.model.ts (follows AGENTS.md ordering)
- ✅ **Task 3**: Verified `loadGroups` action is defined after `groupsAtom` declaration
  - `groupsAtom` declared at line 20 (for early reference if needed)
  - `loadGroups` defined at lines 25-38 (after atom declaration)
  - Extensions applied at lines 41-45 (after both atom and loadGroups are available)
- ✅ **Task 4**: Extended `groupsAtom` with persistence and lifecycle hooks
  - Lines 41-45: `groupsAtom.extend(persistEntityArray<Group>('groups')).extend(withConnectHook(...))`
  - withConnectHook callback wraps loadGroups in arrow function: `() => { loadGroups() }`
- ✅ **Task 5**: Verified TypeScript compilation
  - Ran `bun run tsc --noEmit`
  - No type errors found

## Current State

**Modified file:**

```
src/domain/groups/groups.model.ts - Updated with persistence and lifecycle hooks
```

**Key changes in groups.model.ts:**

1. **Line 2**: Import statement now includes `withConnectHook`:

   ```typescript
   import { atom, action, withAsync, withConnectHook, wrap, type Atom } from '@reatom/core'
   ```

2. **Line 6**: New import for serialization helper:

   ```typescript
   import { persistEntityArray } from '@/lib/storage-serializers'
   ```

3. **Line 20**: `groupsAtom` declared (without extensions initially, for early reference if needed)

   ```typescript
   export const groupsAtom = atom<Atom<Group>[]>([], 'groups.atom')
   ```

4. **Lines 25-38**: `loadGroups` action defined (after atom declaration to access it)

5. **Lines 41-45**: Extensions applied after both atom and loadGroups are defined:

   ```typescript
   // Apply IndexedDB persistence and lifecycle hook
   groupsAtom.extend(persistEntityArray<Group>('groups')).extend(
     withConnectHook(() => {
       loadGroups()
     })
   )
   ```

6. **All CRUD actions unchanged**: createGroup, updateGroup, deleteGroup, reorderGroups remain as-is (they call `groupsAtom.set()` which auto-persists)

**TypeScript Status**: ✅ Compilation succeeds with no errors

## Notes for Next Phase

**Important Architecture Notes:**

1. **Storage Flow (groupsAtom now):**
   - App starts → `groupsAtom` loads from IndexedDB cache (instant)
   - Component mounts → subscribes to `groupsAtom` → `withConnectHook` triggers `loadGroups`
   - Server responds → `groupsAtom.set()` updates atom (persists automatically via `persistEntityArray`)
   - Next page load → cached data loads instantly from IndexedDB

2. **withConnectHook Pattern Used:**
   - Wraps action in arrow function: `withConnectHook(() => { loadGroups() })`
   - Triggers when first subscriber connects (component mounts)
   - Does NOT await the async result (lifecycle hook doesn't support returning promises)

3. **Serialization Automatic:**
   - `persistEntityArray<Group>('groups')` handles serialization:
     - `toSnapshot`: Unwraps atoms to plain Group[] for storage
     - `fromSnapshot`: Re-wraps plain Group[] to Atom<Group>[] on load

**Next Phase (Phase 6):** Update Bookmarks Model with Persistence

- Will apply same pattern to `src/domain/bookmarks/bookmarks.model.ts`
- Add imports: `withConnectHook`, `persistEntityArray`
- Ensure `loadBookmarks` defined after `bookmarksAtom` declaration (same pattern as groups)
- Extend `bookmarksAtom` with `.extend(persistEntityArray<Bookmark>('bookmarks')).extend(withConnectHook(...))`

**Phases Completed:**

1. ✅ Phase 1: Package installed
2. ✅ Phase 2: IndexedDB storage adapter created
3. ✅ Phase 3: Serialization helper created
4. ✅ Phase 4: Spaces model updated with persistence
5. ✅ Phase 5: Groups model updated with persistence
6. ⏳ Phase 6: Bookmarks model
7. ⏳ Phase 7-10: Cleanup and verification

## Potential Issues

None identified. Phase 5 completed successfully:

- ✅ TypeScript compilation passes with no errors
- ✅ Imports properly ordered per AGENTS.md conventions
- ✅ All dependencies defined before use (atom declared before loadGroups, extensions applied after both)
- ✅ CRUD actions continue to work as-is (groupsAtom.set() auto-persists)
- ✅ withConnectHook pattern correctly wraps async action

## Project Files Modified

- Modified: `src/domain/groups/groups.model.ts` (added 2 imports, 5 lines for extensions)
