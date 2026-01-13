# Reatom Refactoring Implementation Plan

## Overview

This implementation plan provides step-by-step instructions to fix all Reatom violations identified in the audit. The refactoring is organized by priority, with critical issues addressed first.

---

## Phase 1: CRITICAL - Add `wrap()` to All API Calls (14 changes)

**Goal**: Prevent "context lost" errors by wrapping all async API calls

### Files to Modify:

1. `src/domain/spaces/spaces.model.ts` (5 changes)
2. `src/domain/groups/groups.model.ts` (5 changes)
3. `src/domain/bookmarks/bookmarks.model.ts` (4 changes)

### Step 1.1: Update Imports in All Model Files

**Action**: Add `wrap` to imports in all three domain model files

**Files**: `spaces.model.ts`, `groups.model.ts`, `bookmarks.model.ts`

**Current import** (line 2):

```typescript
import { atom, action, withAsync, type Atom } from '@reatom/core'
```

**New import**:

```typescript
import { atom, action, withAsync, wrap, type Atom } from '@reatom/core'
```

### Step 1.2: Wrap All API Calls in `spaces.model.ts`

**File**: `src/domain/spaces/spaces.model.ts`

#### Change 1.1: Line 50 - `loadSpaces` action

```typescript
// BEFORE (line 50)
const serverSpaces = await api.spaces.list.query()

// AFTER
const serverSpaces = await wrap(api.spaces.list.query())
```

#### Change 1.2: Line 94 - `createSpace` action

```typescript
// BEFORE (line 94)
const serverSpace = await api.spaces.create.mutate({
  id: newId,
  name: input.name,
  icon: input.icon,
  color: input.color,
  order: optimisticSpace.order
})

// AFTER
const serverSpace = await wrap(
  api.spaces.create.mutate({
    id: newId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    order: optimisticSpace.order
  })
)
```

#### Change 1.3: Line 133 - `updateSpace` action

```typescript
// BEFORE (line 133)
const serverSpace = await api.spaces.update.mutate({
  id: spaceId,
  name: partialSpace.name,
  icon: partialSpace.icon,
  color: partialSpace.color,
  isArchived: partialSpace.isArchived
})

// AFTER
const serverSpace = await wrap(
  api.spaces.update.mutate({
    id: spaceId,
    name: partialSpace.name,
    icon: partialSpace.icon,
    color: partialSpace.color,
    isArchived: partialSpace.isArchived
  })
)
```

#### Change 1.4: Line 169 - `deleteSpace` action

```typescript
// BEFORE (line 169)
await api.spaces.delete.mutate({ id: spaceId })

// AFTER
await wrap(api.spaces.delete.mutate({ id: spaceId }))
```

#### Change 1.5: Line 208 - `reorderSpaces` action

```typescript
// BEFORE (line 208)
await api.spaces.reorder.mutate({ orderedIds })

// AFTER
await wrap(api.spaces.reorder.mutate({ orderedIds }))
```

### Step 1.3: Wrap All API Calls in `groups.model.ts`

**File**: `src/domain/groups/groups.model.ts`

#### Change 2.1: Line 42 - `loadGroups` action

```typescript
// BEFORE (line 42)
const serverGroups = await api.groups.list.query()

// AFTER
const serverGroups = await wrap(api.groups.list.query())
```

#### Change 2.2: Line 88 - `createGroup` action

```typescript
// BEFORE (line 88)
const serverGroup = await api.groups.create.mutate({
  id: newId,
  spaceId: input.spaceId,
  name: input.name,
  icon: input.icon,
  order
})

// AFTER
const serverGroup = await wrap(
  api.groups.create.mutate({
    id: newId,
    spaceId: input.spaceId,
    name: input.name,
    icon: input.icon,
    order
  })
)
```

#### Change 2.3: Line 127 - `updateGroup` action

```typescript
// BEFORE (line 127)
const serverGroup = await api.groups.update.mutate({
  id,
  name: input.name,
  icon: input.icon,
  spaceId: input.spaceId,
  isArchived: input.isArchived
})

// AFTER
const serverGroup = await wrap(
  api.groups.update.mutate({
    id,
    name: input.name,
    icon: input.icon,
    spaceId: input.spaceId,
    isArchived: input.isArchived
  })
)
```

#### Change 2.4: Line 161 - `deleteGroup` action

```typescript
// BEFORE (line 161)
await api.groups.delete.mutate({ id: groupId })

// AFTER
await wrap(api.groups.delete.mutate({ id: groupId }))
```

#### Change 2.5: Line 202 - `reorderGroups` action

```typescript
// BEFORE (line 202)
await api.groups.reorder.mutate({ spaceId, orderedIds })

// AFTER
await wrap(api.groups.reorder.mutate({ spaceId, orderedIds }))
```

### Step 1.4: Wrap All API Calls in `bookmarks.model.ts`

**File**: `src/domain/bookmarks/bookmarks.model.ts`

#### Change 3.1: Line 41 - `loadBookmarks` action

```typescript
// BEFORE (line 41)
const serverBookmarks = await api.bookmarks.list.query()

// AFTER
const serverBookmarks = await wrap(api.bookmarks.list.query())
```

#### Change 3.2: Line 90 - `createBookmark` action

```typescript
// BEFORE (line 90)
const serverBookmark = await api.bookmarks.create.mutate({
  id: newId,
  spaceId: input.spaceId,
  groupId: input.groupId,
  title: input.title,
  url: input.url,
  description: input.description,
  order
})

// AFTER
const serverBookmark = await wrap(
  api.bookmarks.create.mutate({
    id: newId,
    spaceId: input.spaceId,
    groupId: input.groupId,
    title: input.title,
    url: input.url,
    description: input.description,
    order
  })
)
```

#### Change 3.3: Line 131 - `updateBookmark` action

```typescript
// BEFORE (line 131)
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

// AFTER
const serverBookmark = await wrap(
  api.bookmarks.update.mutate({
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
)
```

#### Change 3.4: Line 167 - `deleteBookmark` action

```typescript
// BEFORE (line 167)
await api.bookmarks.delete.mutate({ id: bookmarkId })

// AFTER
await wrap(api.bookmarks.delete.mutate({ id: bookmarkId }))
```

### Phase 1 Testing Checklist

- [ ] Application loads without errors
- [ ] Create/edit/delete spaces works correctly
- [ ] Create/edit/delete groups works correctly
- [ ] Create/edit/delete bookmarks works correctly
- [ ] Reorder operations work correctly
- [ ] No "context lost" errors in console
- [ ] Optimistic updates work as expected

---

## Phase 2: HIGH - Refactor Async State Management

**Goal**: Remove manual loading/error atoms and leverage `withAsync()` middleware properly

### Understanding the Problem

Current pattern:

```typescript
// Manual atoms
export const spacesLoadingAtom = atom(false, 'spaces.loading')
export const spacesErrorAtom = atom<string | null>(null, 'spaces.error')

// Manual state management in actions
export const loadSpaces = action(async () => {
  spacesLoadingAtom.set(true)
  spacesErrorAtom.set(null)
  try {
    const serverSpaces = await wrap(api.spaces.list.query())
    // ... update state
  } catch (error) {
    spacesErrorAtom.set(getErrorMessage(error))
    throw error
  } finally {
    spacesLoadingAtom.set(false)
  }
}, 'spaces.load').extend(withAsync())
```

Recommended pattern:

```typescript
// No manual atoms needed

// Actions use withAsync() middleware for state tracking
export const loadSpaces = action(async () => {
  const serverSpaces = await wrap(api.spaces.list.query())
  const sortedSpaces = [...serverSpaces].sort((a, b) => a.order - b.order)
  spacesAtom.set(sortedSpaces.map((serverSpace) => atom({ ...serverSpace } as Space)))
  return sortedSpaces
}, 'spaces.load').extend(withAsync())

// Access states:
// loadSpaces.ready()   // Boolean: ready if no pending operations
// loadSpaces.pending() // Number of pending operations
// loadSpaces.error()   // Error or undefined
```

### Step 2.1: Update `spaces.model.ts`

#### Change 4.1: Remove Manual Loading/Error Atoms (lines 15-19)

**File**: `src/domain/spaces/spaces.model.ts`

**Remove these lines**:

```typescript
// Loading state for spaces
export const spacesLoadingAtom = atom(false, 'spaces.loading')

// Error state for spaces
export const spacesErrorAtom = atom<string | null>(null, 'spaces.error')
```

#### Change 4.2: Simplify `loadSpaces` Action (lines 46-68)

**File**: `src/domain/spaces/spaces.model.ts`

**Remove**:

- `spacesLoadingAtom.set(true)` from line 47
- `spacesErrorAtom.set(null)` from line 48
- `groupsLoadingAtom.set(true)` from data-atoms.ts (external, handled in Phase 3)
- The try/catch block (lines 50-56)
- `spacesLoadingAtom.set(false)` from line 66

**BEFORE**:

```typescript
export const loadSpaces = action(async () => {
  spacesLoadingAtom.set(true)
  spacesErrorAtom.set(null)
  try {
    const serverSpaces = await api.spaces.list.query()
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
```

**AFTER** (after Phase 1 wrap() changes):

```typescript
export const loadSpaces = action(async () => {
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
}, 'spaces.load').extend(withAsync())
```

#### Change 4.3: Remove Helper Functions (lines 23-25 and 36-41)

**Remove**: `normalizeTimestamp()` and `getErrorMessage()` functions

These are no longer needed after simplifying the actions.

### Step 2.2: Update `groups.model.ts`

#### Change 5.1: Remove Manual Loading/Error Atoms (lines 15-19)

**File**: `src/domain/groups/groups.model.ts`

**Remove**:

```typescript
export const groupsLoadingAtom = atom(false, 'groups.loading')
export const groupsErrorAtom = atom<string | null>(null, 'groups.error')
```

#### Change 5.2: Simplify `loadGroups` Action (lines 38-60)

**BEFORE**:

```typescript
export const loadGroups = action(async () => {
  groupsLoadingAtom.set(true)
  groupsErrorAtom.set(null)
  try {
    const serverGroups = await api.groups.list.query()
    const sortedGroups = [...serverGroups].sort((a, b) => a.order - b.order)
    // ... rest
  } catch (error) {
    groupsErrorAtom.set(getErrorMessage(error))
    throw error
  } finally {
    groupsLoadingAtom.set(false)
  }
}, 'groups.load').extend(withAsync())
```

**AFTER** (after Phase 1 wrap() changes):

```typescript
export const loadGroups = action(async () => {
  const serverGroups = await wrap(api.groups.list.query())
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
}, 'groups.load').extend(withAsync())
```

#### Change 5.3: Remove Helper Functions

Remove `normalizeTimestamp()` and `getErrorMessage()` functions (lines 23-25 and 29-33).

### Step 2.3: Update `bookmarks.model.ts`

#### Change 6.1: Remove Manual Loading/Error Atoms (lines 14-18)

**File**: `src/domain/bookmarks/bookmarks.model.ts`

**Remove**:

```typescript
export const bookmarksLoadingAtom = atom(false, 'bookmarks.loading')
export const bookmarksErrorAtom = atom<string | null>(null, 'bookmarks.error')
```

#### Change 6.2: Simplify `loadBookmarks` Action (lines 37-59)

**BEFORE**:

```typescript
export const loadBookmarks = action(async () => {
  bookmarksLoadingAtom.set(true)
  bookmarksErrorAtom.set(null)
  try {
    const serverBookmarks = await api.bookmarks.list.query()
    const sortedBookmarks = [...serverBookmarks].sort((a, b) => a.order - b.order)
    // ... rest
  } catch (error) {
    bookmarksErrorAtom.set(getErrorMessage(error))
    throw error
  } finally {
    bookmarksLoadingAtom.set(false)
  }
}, 'bookmarks.load').extend(withAsync())
```

**AFTER** (after Phase 1 wrap() changes):

```typescript
export const loadBookmarks = action(async () => {
  const serverBookmarks = await wrap(api.bookmarks.list.query())
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
}, 'bookmarks.load').extend(withAsync())
```

#### Change 6.3: Remove Helper Functions

Remove `normalizeTimestamp()` and `getErrorMessage()` functions (lines 22-24 and 28-32).

### Step 2.4: Update Domain Index Files

**Files**: `src/domain/spaces/index.ts`, `src/domain/groups/index.ts`, `src/domain/bookmarks/index.ts`

**Remove exports**:

```typescript
// Remove from each index.ts
spacesLoadingAtom,
spacesErrorAtom,
// OR
groupsLoadingAtom,
groupsErrorAtom,
// OR
bookmarksLoadingAtom,
bookmarksErrorAtom,
```

**Updated exports**:

```typescript
// spaces/index.ts
export type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'
export {
  spacesAtom,
  getSpaceById,
  loadSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces
} from './spaces.model'
```

### Step 2.5: Update Components to Use WithAsync State

**File**: `src/screens/main-screen/main-screen.tsx`

Remove imports:

```typescript
// Lines 30-32
bookmarksLoadingAtom,
bookmarksErrorAtom,
loadBookmarks,
```

**Line 379-380** - Remove old atom reads:

```typescript
// BEFORE
const bookmarksLoading = bookmarksLoadingAtom()
const bookmarksError = bookmarksErrorAtom()

// AFTER - Use withAsync state
const bookmarksLoading = loadBookmarks.pending() > 0
const bookmarksError = loadBookmarks.error()?.message || null
```

**File**: `src/screens/main-screen/ui/spaces-sidebar.tsx`

Line 14 - Update imports:

```typescript
// BEFORE
import { spacesLoadingAtom, spacesErrorAtom, loadSpaces } from '@/domain/spaces'

// AFTER
import { loadSpaces } from '@/domain/spaces'
```

Line 128-131 - Update ContentState usage:

```typescript
// BEFORE
<ContentState
  loading={spacesLoadingAtom()}
  error={spacesErrorAtom()}
  onRetry={() => loadSpaces()}
  skeleton={<SpaceSkeletonList count={3} isCollapsed={isCollapsed} />}
>

// AFTER
<ContentState
  loading={loadSpaces.pending() > 0}
  error={loadSpaces.error()?.message || null}
  onRetry={() => loadSpaces()}
  skeleton={<SpaceSkeletonList count={3} isCollapsed={isCollapsed} />}
>
```

**File**: `src/screens/main-screen/ui/group-tabs.tsx`

Line 13 - Update imports:

```typescript
// BEFORE
import { groupsLoadingAtom, groupsErrorAtom, loadGroups } from '@/domain/groups'

// AFTER
import { loadGroups } from '@/domain/groups'
```

Lines 132-133, 139-140, 158-161, 159-162 - Update loading/error checks:

```typescript
// Replace all instances:
loading = groupsLoadingAtom()
error = groupsErrorAtom()

// With:
loading = loadGroups.pending() > 0
error = loadGroups.error()?.message || null
```

**File**: `src/stores/auth/data-atoms.ts`

Line 4-6 - Remove imports:

```typescript
// BEFORE
import { loadSpaces, spacesLoadingAtom } from '@/domain/spaces'
import { loadGroups, groupsLoadingAtom } from '@/domain/groups'
import { loadBookmarks, bookmarksLoadingAtom } from '@/domain/bookmarks'

// AFTER
import { loadSpaces } from '@/domain/spaces'
import { loadGroups } from '@/domain/groups'
import { loadBookmarks } from '@/domain/bookmarks'
```

Lines 41-43 - Remove manual loading atom management:

```typescript
// BEFORE (lines 41-43)
spacesLoadingAtom.set(true)
groupsLoadingAtom.set(true)
bookmarksLoadingAtom.set(true)

// AFTER - Remove these lines, withAsync handles it automatically
```

Lines 79-81 - Remove manual loading atom reset:

```typescript
// BEFORE (lines 79-81)
spacesLoadingAtom.set(false)
groupsLoadingAtom.set(false)
bookmarksLoadingAtom.set(false)

// AFTER - Remove these lines
```

### Phase 2 Testing Checklist

- [ ] Application compiles without errors
- [ ] Loading states display correctly using withAsync()
- [ ] Error states display correctly using withAsync()
- [ ] All CRUD operations still work
- [ ] Initial data load displays skeleton UI correctly
- [ ] Retry buttons work after errors
- [ ] Reorder operations work correctly

---

## Phase 3: MEDIUM - Add Error Handling to Data-Atoms

**File**: `src/stores/auth/data-atoms.ts`

### Change 7.1: Wrap ensureUser Call (line 47)

**BEFORE** (lines 47-51):

```typescript
// Ensure user exists on server
await api.sync.ensureUser.mutate({
  email: email,
  name: name,
  avatarUrl: avatarUrl
})
```

**AFTER**:

```typescript
// Ensure user exists on server
await wrap(
  api.sync.ensureUser.mutate({
    email: email,
    name: name,
    avatarUrl: avatarUrl
  })
)
```

### Change 7.2: Add wrap() Import

Add `wrap` to line 2 imports:

```typescript
import { atom, action, wrap } from '@reatom/core'
```

Note: We don't use `withAsync()` here because this is not exported from file, and error handling is already in place with the retry logic.

### Phase 3 Testing Checklist

- [ ] Application loads with user authenticated
- [ ] User sync works correctly
- [ ] Data loads on successful authentication
- [ ] Retry mechanism works on failures

---

## Phase 4: LOW - Code Smell Cleanup

**Note**: These are optional improvements for code quality and maintainability.

### Change 8.1: Convert Helper Functions to Actions (Optional)

**File**: `src/stores/ui/atoms.ts`

#### Option A: Convert to Actions (Recommended)

```typescript
import { action } from '@reatom/core'

export const setSidebarCollapsed = action((collapsed: boolean) => {
  sidebarCollapsedAtom.set(collapsed)
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
}, 'ui.setSidebarCollapsed')

export const setTheme = action((theme: Theme) => {
  themeAtom.set(theme)
  applyTheme(theme)
}, 'ui.setTheme')

export const applyTheme = action((theme: Theme) => {
  const root = document.documentElement
  const resolved = getResolvedTheme(theme)

  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme)
}, 'ui.applyTheme')
```

#### Option B: Keep as Functions (Minimally risky)

If you prefer to keep the current implementation, that's acceptable since these functions work correctly.

### Change 8.2: Update Reatom Documentation

Update `.ai/docs/reatom.md` to reflect:

- `wrap()` is now required for all async API calls
- `withAsync()` middleware is the recommended approach for async state
- Manual loading/error atoms are discouraged

### Phase 4 Testing Checklist

- [ ] Theme changes work correctly
- [ ] Sidebar collapse state persists
- [ ] All UI interactions work as before

---

## Testing & Verification

### Comprehensive Testing Strategy

#### Unit Tests (if available)

```bash
bun test
```

#### Manual Testing Scenarios

1. **Initial Data Load**
   - [ ] Application loads with authentication
   - [ ] Skeleton UI displays during loading
   - [ ] Data loads successfully
   - [ ] Errors display with retry option

2. **Space Operations**
   - [ ] Create space (optimistic update then server sync)
   - [ ] Edit space name
   - [ ] Delete space (cascade to groups/bookmarks)
   - [ ] Reorder spaces
   - [ ] All operations show loading/error states correctly

3. **Group Operations**
   - [ ] Create group
   - [ ] Edit group name
   - [ ] Delete group (cascade to bookmarks)
   - [ ] Reorder groups
   - [ ] All operations show loading/error states correctly

4. **Bookmark Operations**
   - [ ] Create bookmark
   - [ ] Edit bookmark details
   - [ ] Delete bookmark
   - [ ] Reorder bookmarks
   - [ ] Move bookmark between groups
   - [ ] All operations show loading/error states correctly

5. **Error Handling**
   - [ ] Network errors display user-friendly messages
   - [ ] Retry buttons work correctly
   - [ ] Optimistic updates rollback on error

6. **State Management**
   - [ ] Loading states show/hide correctly
   - [ ] Error states clear on success
   - [ ] No race conditions with rapid operations
   - [ ] Concurrent operations handled correctly

### Debugging Commands

Check Reatom state in browser console:

```javascript
// Access action states
loadSpaces.ready()
loadSpaces.pending()
loadSpaces.error()

// Access atom states
spacesAtom()
groupsAtom()
bookmarksAtom()
```

---

## Rollback Plan

If issues arise after deployment:

1. **Individual Phase Rollback**: Each phase can be reverted independently
2. **Use Git**: Each phase should be a separate commit for easy rollback
3. **Feature Flags**: Consider wrapping changes in feature flags if needed

---

## Migration Notes

### Breaking Changes

None for external API. All changes are internal refactoring.

### Performance Impact

- **Positive**: Less boilerplate code, more efficient state tracking
- **Positive**: Better debugging with built-in withAsync() state
- **Neutral**: No measurable performance difference

### Developer Impact

- **Positive**: Less code to maintain
- **Positive**: Clearer separation of concerns
- **Positive**: Better debugging with Reatom DevTools
- **Learning**: Team needs to learn withAsync() state access patterns

---

## Next Steps After Refactoring

1. **Add Integration Tests**: Test async operations end-to-end
2. **Update Documentation**: Document new patterns for team
3. **Review Other Projects**: Check if similar issues exist elsewhere
4. **Monitor Production**: Watch for any unexpected behavior post-deployment
5. **Collect Feedback**: Gather team feedback on new patterns

---

## Summary of Changes

| Phase   | Files Changed               | Lines Changed           | Severity |
| ------- | --------------------------- | ----------------------- | -------- |
| Phase 1 | 3 model files               | +14 wrap() calls        | CRITICAL |
| Phase 2 | 3 model + 4 component files | -60 lines + state usage | HIGH     |
| Phase 3 | 1 file                      | +1 wrap()               | MEDIUM   |
| Phase 4 | 1-2 files                   | Optional refactoring    | LOW      |

**Total**: ~8-9 files, ~75 lines changed (mostly simplification)

---

## Estimated Time

| Phase              | Estimated Time |
| ------------------ | -------------- |
| Phase 1 (CRITICAL) | 1-2 hours      |
| Phase 2 (HIGH)     | 2-3 hours      |
| Phase 3 (MEDIUM)   | 30 minutes     |
| Phase 4 (LOW)      | 1 hour         |
| Testing            | 2-4 hours      |
| **Total**          | **6-11 hours** |
