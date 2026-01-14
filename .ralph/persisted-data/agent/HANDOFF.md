# Phase 4 Handoff: Update Spaces Model with Persistence

## What Was Done

- ✅ **Task 1**: Added import `withConnectHook` from `@reatom/core`
  - Import added to line 2 of spaces.model.ts
- ✅ **Task 2**: Added import `persistEntityArray` from `@/lib/storage-serializers`
  - Import added to line 7 of spaces.model.ts (follows AGENTS.md ordering)
- ✅ **Task 3**: Verified `loadSpaces` action is defined before `spacesAtom`
  - `spacesAtom` declared at line 14 (for early reference in getSpaceById)
  - `loadSpaces` defined at lines 33-46 (after atom declaration)
  - Extensions applied at lines 48-53 (after both atom and loadSpaces are available)
- ✅ **Task 4**: Extended `spacesAtom` with persistence and lifecycle hooks
  - Line 48-53: `spacesAtom.extend(persistEntityArray<Space>('spaces')).extend(withConnectHook(...))`
  - withConnectHook callback wraps loadSpaces in arrow function: `() => { loadSpaces() }`
- ✅ **Task 5**: Verified TypeScript compilation
  - Ran `bun run tsc --noEmit`
  - No type errors found

## Current State

**Modified file:**

```
src/domain/spaces/spaces.model.ts - Updated with persistence and lifecycle hooks
```

**Key changes in spaces.model.ts:**

1. **Line 2**: Import statement now includes `withConnectHook`:

   ```typescript
   import { atom, action, withAsync, withConnectHook, wrap, type Atom } from '@reatom/core'
   ```

2. **Line 7**: New import for serialization helper:

   ```typescript
   import { persistEntityArray } from '@/lib/storage-serializers'
   ```

3. **Line 14**: `spacesAtom` declared (without extensions, for early reference)

   ```typescript
   export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom')
   ```

4. **Lines 48-53**: Extensions applied after `loadSpaces` is defined:

   ```typescript
   // Apply IndexedDB persistence and lifecycle hook
   spacesAtom.extend(persistEntityArray<Space>('spaces')).extend(
     withConnectHook(() => {
       loadSpaces()
     })
   )
   ```

5. **All CRUD actions unchanged**: createSpace, updateSpace, deleteSpace, reorderSpaces remain as-is (they call `spacesAtom.set()` which auto-persists)

**TypeScript Status**: ✅ Compilation succeeds with no errors

## Notes for Next Phase

**Important Architecture Notes:**

1. **Storage Flow (spacesAtom now):**
   - App starts → `spacesAtom` loads from IndexedDB cache (instant)
   - Component mounts → subscribes to `spacesAtom` → `withConnectHook` triggers `loadSpaces`
   - Server responds → `spacesAtom.set()` updates atom (persists automatically via `persistEntityArray`)
   - Next page load → cached data loads instantly from IndexedDB

2. **withConnectHook Pattern Used:**
   - Wraps action in arrow function: `withConnectHook(() => { loadSpaces() })`
   - Triggers when first subscriber connects (component mounts)
   - Does NOT await the async result (lifecycle hook doesn't support returning promises)

3. **Serialization Automatic:**
   - `persistEntityArray<Space>('spaces')` handles serialization:
     - `toSnapshot`: Unwraps atoms to plain Space[] for storage
     - `fromSnapshot`: Re-wraps plain Space[] to Atom<Space>[] on load

**Next Phase (Phase 5):** Update Groups Model with Persistence

- Will apply same pattern to `src/domain/groups/groups.model.ts`
- Add imports: `withConnectHook`, `persistEntityArray`
- Ensure `loadGroups` defined before extensions applied
- Extend `groupsAtom` with `.extend(persistEntityArray<Group>('groups')).extend(withConnectHook(...))`

**Phases Completed:**

1. ✅ Phase 1: Package installed
2. ✅ Phase 2: IndexedDB storage adapter created
3. ✅ Phase 3: Serialization helper created
4. ✅ Phase 4: Spaces model updated with persistence
5. ⏳ Phase 5-6: Groups and bookmarks models
6. ⏳ Phase 7-10: Cleanup and verification

## Potential Issues

None identified. Phase 4 completed successfully:

- ✅ TypeScript compilation passes with no errors
- ✅ Imports properly ordered per AGENTS.md conventions
- ✅ All dependencies defined before use (atom before getSpaceById, loadSpaces before withConnectHook)
- ✅ CRUD actions continue to work as-is (spacesAtom.set() auto-persists)
- ✅ withConnectHook pattern correctly wraps async action

## Project Files Modified

- Modified: `src/domain/spaces/spaces.model.ts` (added 2 imports, 5 lines for extensions, removed 1 blank line)
