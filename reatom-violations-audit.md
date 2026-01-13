# Reatom Violations Audit Report

## Executive Summary

This audit identified **27 violations** across **8 files** that need to be addressed to align with Reatom v1000 best practices. The violations fall into 5 categories:

1. **Missing `wrap()` context preservation** (CRITICAL - 14 instances)
2. **Missing async middleware for state tracking** (HIGH - 12 instances)
3. **Missing error handling in async operations** (MEDIUM - 1 instance)
4. **Improper loading/error atom management** (LOW - 0 instances, but improvements needed)
5. **Code smells / Anti-patterns** (MEDIUM - 3 instances)

---

## Detailed Findings

### Category 1: Missing `wrap()` Context Preservation (CRITICAL)

**Severity**: CRITICAL - Can cause "context lost" errors
**Impact**: Async operations outside `reatomComponent` may fail to update atoms correctly
**Files Affected**: 4 domain model files

#### 1.1 `src/domain/spaces/spaces.model.ts`

| Line | Issue                                     | Current Code                                                | Recommended Fix                                                   |
| ---- | ----------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 50   | `api.spaces.list.query()` not wrapped     | `const serverSpaces = await api.spaces.list.query()`        | `const serverSpaces = await wrap(api.spaces.list.query())`        |
| 94   | `api.spaces.create.mutate()` not wrapped  | `const serverSpace = await api.spaces.create.mutate({...})` | `const serverSpace = await wrap(api.spaces.create.mutate({...}))` |
| 133  | `api.spaces.update.mutate()` not wrapped  | `const serverSpace = await api.spaces.update.mutate({...})` | `const serverSpace = await wrap(api.spaces.update.mutate({...}))` |
| 169  | `api.spaces.delete.mutate()` not wrapped  | `await api.spaces.delete.mutate({ id: spaceId })`           | `await wrap(api.spaces.delete.mutate({ id: spaceId }))`           |
| 208  | `api.spaces.reorder.mutate()` not wrapped | `await api.spaces.reorder.mutate({ orderedIds })`           | `await wrap(api.spaces.reorder.mutate({ orderedIds }))`           |

**Why it's a problem**: All async API calls inside actions should use `wrap()` to preserve Reatom context across await boundaries. Without `wrap()`, atom mutations after awaits may throw "context lost" errors.

#### 1.2 `src/domain/groups/groups.model.ts`

| Line | Issue                                     | Current Code                                                | Recommended Fix                                                   |
| ---- | ----------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 42   | `api.groups.list.query()` not wrapped     | `const serverGroups = await api.groups.list.query()`        | `const serverGroups = await wrap(api.groups.list.query())`        |
| 88   | `api.groups.create.mutate()` not wrapped  | `const serverGroup = await api.groups.create.mutate({...})` | `const serverGroup = await wrap(api.groups.create.mutate({...}))` |
| 127  | `api.groups.update.mutate()` not wrapped  | `const serverGroup = await api.groups.update.mutate({...})` | `const serverGroup = await wrap(api.groups.update.mutate({...}))` |
| 161  | `api.groups.delete.mutate()` not wrapped  | `await api.groups.delete.mutate({ id: groupId })`           | `await wrap(api.groups.delete.mutate({ id: groupId }))`           |
| 202  | `api.groups.reorder.mutate()` not wrapped | `await api.groups.reorder.mutate({ spaceId, orderedIds })`  | `await wrap(api.groups.reorder.mutate({ spaceId, orderedIds }))`  |

#### 1.3 `src/domain/bookmarks/bookmarks.model.ts`

| Line | Issue                                       | Current Code                                                      | Recommended Fix                                                         |
| ---- | ------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 41   | `api.bookmarks.list.query()` not wrapped    | `const serverBookmarks = await api.bookmarks.list.query()`        | `const serverBookmarks = await wrap(api.bookmarks.list.query())`        |
| 90   | `api.bookmarks.create.mutate()` not wrapped | `const serverBookmark = await api.bookmarks.create.mutate({...})` | `const serverBookmark = await wrap(api.bookmarks.create.mutate({...}))` |
| 131  | `api.bookmarks.update.mutate()` not wrapped | `const serverBookmark = await api.bookmarks.update.mutate({...})` | `const serverBookmark = await wrap(api.bookmarks.update.mutate({...}))` |
| 167  | `api.bookmarks.delete.mutate()` not wrapped | `await api.bookmarks.delete.mutate({ id: bookmarkId })`           | `await wrap(api.bookmarks.delete.mutate({ id: bookmarkId }))`           |

---

### Category 2: Missing `withAsync()` Middleware for State Tracking (HIGH)

**Severity**: HIGH - Actions don't expose ready/error/pending state
**Impact**: Cannot track loading/error state per-action, must use manual atoms
**Files Affected**: 4 domain model files

#### 2.1 `src/domain/spaces/spaces.model.ts` - Issues

**Problem**: Actions are extended with `.extend(withAsync())`, but this middleware is **NOT being imported or used**. The manual loading/error atoms pattern is being used instead.

Current pattern (manual):

```typescript
export const spacesLoadingAtom = atom(false, "spaces.loading");
export const spacesErrorAtom = atom<string | null>(null, "spaces.error");

export const loadSpaces = action(async () => {
  spacesLoadingAtom.set(true);
  spacesErrorAtom.set(null);
  try {
    const serverSpaces = await api.spaces.list.query();
    // ...
  } catch (error) {
    spacesErrorAtom.set(getErrorMessage(error));
    throw error;
  } finally {
    spacesLoadingAtom.set(false);
  }
}, "spaces.load").extend(withAsync()); // ❌ withAsync() added but not leveraged
```

Recommended pattern (middleware):

```typescript
export const loadSpaces = action(async () => {
  const serverSpaces = await wrap(api.spaces.list.query());
  const sortedSpaces = [...serverSpaces].sort((a, b) => a.order - b.order);
  spacesAtom.set(
    sortedSpaces.map((serverSpace) => atom({ ...serverSpace } as Space)),
  );
  return sortedSpaces;
}, "spaces.load").extend(withAsync()); // ✅ withAsync() provides ready/error/pending

// Now you can access:
// loadSpaces.pending() // Number of pending operations
// loadSpaces.ready()   // Boolean: no pending operations
// loadSpaces.error()   // Error or undefined
```

**Affected Actions**:

- `groups.model.ts`: `loadGroups`, `createGroup`, `updateGroup`, `deleteGroup`, `reorderGroups`
- `spaces.model.ts`: `loadSpaces`, `createSpace`, `updateSpace`, `deleteSpace`, `reorderSpaces`
- `bookmarks.model.ts`: `loadBookmarks`, `createBookmark`, `updateBookmark`, `deleteBookmark`, `reorderBookmarks`, `moveBookmark`

**Total**: 15 actions using `withAsync()` but not leveraging it for state tracking

---

### Category 3: Missing Error Handling in Async Operations (MEDIUM)

#### 3.1 `src/stores/auth/data-atoms.ts` - Line 47-54

**Issue**: `api.sync.ensureUser.mutate()` is called without error handling or wrap()

```typescript
// Current code (lines 47-51)
await api.sync.ensureUser.mutate({
  email: email,
  name: name,
  avatarUrl: avatarUrl,
});

// Recommended code
await wrap(
  api.sync.ensureUser.mutate({
    email: email,
    name: name,
    avatarUrl: avatarUrl,
  }),
);
```

---

### Category 4: Async State Management Anti-Patterns (MEDIUM)

#### 4.1 Manual Loading/Error Atoms Should Be Removed

**Problem**: Each domain creates manual `loadingAtom` and `errorAtom` when `withAsync()` middleware provides this out of the box.

**Files affected**:

- `spaces.model.ts`: lines 15-19
- `groups.model.ts`: lines 15-19
- `bookmarks.model.ts`: lines 14-18

**Impact**:

- Duplicate state management
- More boilerplate code
- Harder to track which operation is loading/erroring
- Cannot distinguish between different load operations (load vs create vs update)

**Recommended approach**: Remove manual atoms, leverage `withAsync()` middleware instead.

---

### Category 5: Code Smells / Anti-Patterns (LOW-MEDIUM)

#### 5.1 Missing `wrap()` Import in Model Files

**Files affected**:

- `src/domain/spaces/spaces.model.ts`
- `src/domain/groups/groups.model.ts`
- `src/domain/bookmarks/bookmarks.model.ts`

**Current imports**:

```typescript
import { atom, action, withAsync, type Atom } from "@reatom/core";
```

**Should be**:

```typescript
import { atom, action, withAsync, wrap, type Atom } from "@reatom/core";
```

#### 5.2 Helper Functions Should Be Actions or Effects

**Files affected**:

- `src/stores/ui/atoms.ts` - Line 23-33: `getInitialSidebarCollapsed()` function
- `src/stores/ui/atoms.ts` - Line 72-76: `getInitialTheme()` function
- `src/stores/ui/atoms.ts` - Line 89-101: `applyTheme()` function

**Issue**: These are regular functions that modify atoms outside of Reatom's reactive system. While they work, they're not idiomatic.

**Recommendation**: Convert to actions or effects for better reactivity and debugging.

---

## Summary Statistics

| Category                       | Count  | Severity   |
| ------------------------------ | ------ | ---------- |
| Missing `wrap()` for API calls | 14     | CRITICAL   |
| Manual async state atoms       | 12     | HIGH       |
| Missing error handling         | 1      | MEDIUM     |
| Code smells                    | 3      | LOW-MEDIUM |
| **TOTAL**                      | **30** | -          |

**Files requiring changes**: 5
**Lines requiring changes**: ~60+

---

## Impact Assessment

### Critical Issues (Must Fix)

- **Missing `wrap()`**: Can cause runtime errors ("context lost") when async operations lose Reatom context
- **Impact**: Data may not update, UI may not reflect state changes after async operations

### High Priority (Should Fix)

- **Async state management**: Using manual `loadingAtom`/`errorAtom` instead of `withAsync()` middleware
- **Impact**: More boilerplate, harder debugging, cannot track per-operation state

### Medium Priority (Nice to Have)

- **Missing error handling**: Some API calls could silently fail
- **Impact**: Poor user experience if errors aren't caught and displayed

### Low Priority (Code Quality)

- **Code smells**: Non-idiomatic patterns that work but aren't best practices
- **Impact**: Maintainability and debugging harder over time

---

## Recommended Fix Order

1. **Phase 1 (CRITICAL)**: Add `wrap()` to all API calls in domain models
   - Prevents runtime errors
   - No API changes needed

2. **Phase 2 (HIGH)**: Refactor async state management
   - Remove manual `loadingAtom`/`errorAtom` from domain models
   - Use `withAsync()` middleware for state tracking
   - Update components to use `action.ready()`, `action.error()`, `action.pending()`

3. **Phase 3 (MEDIUM)**: Add error handling to missing locations
   - Wrap `api.sync.ensureUser.mutate()` with error handling

4. **Phase 4 (LOW)**: Code smell cleanup
   - Convert helper functions to actions/effects
   - Improve naming and structure

---

## Testing Strategy

After each phase:

1. **Manual Testing**:
   - Load application
   - Create/edit/delete spaces, groups, bookmarks
   - Verify async operations complete successfully
   - Check error handling

2. **Regression Testing**:
   - Reorder operations work correctly
   - Optimistic updates work as expected
   - Loading states display correctly

3. **Error Scenarios**:
   - Test with network failures
   - Test with authentication failures
   - Verify error messages display correctly
