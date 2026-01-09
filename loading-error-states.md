# Implementation Plan: Loading & Error States

## Problem Statement

Current behavior:

- User sees empty state immediately on first load
- Data appears suddenly with no visual transition
- Errors are logged to console only, no UI feedback
- Existing `dataLoadingAtom`, `dataErrorAtom` are unused

Expected behavior:

- Final UI structure renders immediately
- Each section handles its own loading/error state internally
- No layout shifts or staggered reveals
- Auto-retry with exponential backoff on failures
- Silent transitions when data loads successfully

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         AuthGuard                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    MainScreen                        │   │
│  │  ┌─────────┐  ┌────────────────────────────────────┐   │
│  │  │Sidebar  │  │ Header                          │   │   │
│  │  │         │  │ ┌────────────┐ ┌─────────────┐ │   │   │
│  │  │ Loading │  │ │ GroupTabs  │ │  UserMenu   │ │   │   │
│  │  │   OR    │  │ │  Loading   │ │             │ │   │   │
│  │  │ Content │  │ │  OR Error  │ │             │ │   │   │
│  │  │   OR    │  │ │  OR Content│ │             │ │   │   │
│  │  │ Error   │  │ └────────────┘ └─────────────┘ │   │   │
│  │  │         │  ├────────────────────────────────┤   │   │
│  │  │         │  │ Content Area                   │   │   │
│  │  │         │  │                                │   │   │
│  │  │         │  │   Loading / Error / Content    │   │   │
│  │  │         │  │                                │   │   │
│  │  └─────────┘  └────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

Each section manages its own state independently. No parent-level loading gates.

---

## Implementation Phases

### Phase 1: State Infrastructure

#### 1.1 Enhance Data Atoms

**File:** `src/stores/auth/data-atoms.ts`

Add retry action and retry count tracking:

```typescript
import { atom, action } from '@reatom/core'

// Existing atoms
export const dataLoadingAtom = atom(false, 'auth.dataLoading')
export const dataLoadedAtom = atom(false, 'auth.dataLoaded')
export const dataErrorAtom = atom<string | null>(null, 'auth.dataError')

// NEW: Retry count for exponential backoff
export const retryCountAtom = atom(0, 'auth.retryCount')

// NEW: Retry action (will be connected in clerk-user-sync)
export const retryLoadData = action(async (ctx) => {
  // Implementation in clerk-user-sync.tsx
}, 'auth.retryLoadData')
```

#### 1.2 Update ClerkUserSync for Auto-Retry

**File:** `src/app/auth/clerk-user-sync.tsx`

Add auto-retry logic with exponential backoff:

- Max 3 retries
- Delays: 2s, 4s, 8s
- Reset retry count on success
- Expose `retryLoadData` action that re-triggers `loadUserData`

```typescript
const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000

async function loadUserDataWithRetry(email?: string, name?: string, avatarUrl?: string) {
  let retries = 0

  while (retries <= MAX_RETRIES) {
    try {
      await loadUserData(email, name, avatarUrl)
      retryCountAtom.set(0) // Reset on success
      return
    } catch (error) {
      retries++
      retryCountAtom.set(retries)

      if (retries > MAX_RETRIES) {
        throw error
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = BASE_DELAY_MS * Math.pow(2, retries - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
```

---

### Phase 2: Reusable Loading Components

#### 2.1 Create Spinner Component

**File:** `src/shared/ui/kit/spinner.tsx` (new)

Minimal centered spinner for content areas:

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}
```

Design specs:

- Uses `Loader2` icon with `animate-spin`
- Centered in parent container via flexbox
- Optional message in `text-muted-foreground`
- Sizes: `sm` (16px), `md` (24px), `lg` (32px)

```tsx
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8'
}

export function Spinner({ size = 'md', message, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size])} />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
```

#### 2.2 Create InlineError Component

**File:** `src/shared/ui/kit/inline-error.tsx` (new)

Compact error display for embedding in content areas:

```typescript
interface InlineErrorProps {
  message: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}
```

Design specs:

- Subtle destructive styling (not aggressive)
- `AlertCircle` icon in `text-destructive/60`
- Error text in `text-sm text-muted-foreground`
- Compact retry button (ghost variant, small)
- Shows "Retrying..." state when `retrying` is true

```tsx
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function InlineError({ message, onRetry, retrying, className }: InlineErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-4', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="size-4 text-destructive/60" />
        <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} disabled={retrying} className="gap-2">
          <RefreshCw className={cn('size-3', retrying && 'animate-spin')} />
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  )
}
```

#### 2.3 Create ContentState Wrapper

**File:** `src/shared/ui/kit/content-state.tsx` (new)

Utility component handling loading/error/content states:

```typescript
interface ContentStateProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
  retrying?: boolean
  loadingMessage?: string
  children: React.ReactNode
  className?: string
}
```

Usage pattern:

```tsx
<ContentState loading={spacesLoadingAtom()} error={spacesErrorAtom()} onRetry={retryLoadSpaces}>
  {/* Actual content */}
</ContentState>
```

Implementation:

```tsx
import { Spinner } from './spinner'
import { InlineError } from './inline-error'
import { cn } from '@/lib/utils'

export function ContentState({
  loading,
  error,
  onRetry,
  retrying,
  loadingMessage,
  children,
  className
}: ContentStateProps) {
  if (loading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <Spinner message={loadingMessage} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <InlineError message={error} onRetry={onRetry} retrying={retrying} />
      </div>
    )
  }

  return <>{children}</>
}
```

---

### Phase 3: Domain-Level Error Atoms

Add error tracking per domain alongside existing loading atoms.

#### 3.1 Update Spaces Domain

**File:** `src/domain/spaces/spaces.model.ts`

```typescript
// Add error atom
export const spacesErrorAtom = atom<string | null>(null, 'spaces.error')

// Update loadSpaces action
export const loadSpaces = action(async (ctx) => {
  spacesLoadingAtom.set(true)
  spacesErrorAtom.set(null)

  try {
    const data = await api.spaces.list.query()
    // ... existing logic
    return data
  } catch (error) {
    spacesErrorAtom.set(getErrorMessage(error))
    throw error
  } finally {
    spacesLoadingAtom.set(false)
  }
}, 'spaces.load')
```

#### 3.2 Update Groups Domain

**File:** `src/domain/groups/groups.model.ts`

```typescript
export const groupsErrorAtom = atom<string | null>(null, 'groups.error')

// Update loadGroups action with same pattern
```

#### 3.3 Update Bookmarks Domain

**File:** `src/domain/bookmarks/bookmarks.model.ts`

```typescript
export const bookmarksErrorAtom = atom<string | null>(null, 'bookmarks.error')

// Update loadBookmarks action with same pattern
```

#### 3.4 Update Domain Exports

**Files:** `src/domain/*/index.ts`

Export new error atoms from each domain barrel file.

---

### Phase 4: Update UI Components

#### 4.1 Update SpacesSidebar

**File:** `src/screens/main-screen/ui/spaces-sidebar.tsx`

Integrate ContentState for the spaces list area:

```tsx
export const SpacesSidebar = reatomComponent(({ ... }) => {
  const loading = spacesLoadingAtom()
  const error = spacesErrorAtom()

  return (
    <aside className="...">
      {/* Header - always visible */}
      <div className="...">
        <Button onClick={onToggleCollapse}>...</Button>
      </div>

      {/* Content area with state handling */}
      <div className="flex-1 overflow-auto">
        <ContentState
          loading={loading}
          error={error}
          onRetry={() => loadSpaces()}
          loadingMessage="Loading spaces..."
        >
          {spaces.length === 0 && !draftSpace ? (
            <SidebarEmptyHint onAdd={onAddSpace} />
          ) : (
            <SpacesList spaces={spaces} ... />
          )}
        </ContentState>
      </div>

      {/* Add button - always visible */}
      <div className="...">
        <Button onClick={onAddSpace}>Add Space</Button>
      </div>
    </aside>
  )
}, 'SpacesSidebar')
```

#### 4.2 Update GroupTabs

**File:** `src/screens/main-screen/ui/group-tabs.tsx`

Same pattern - container always renders, tabs area handles state:

```tsx
export const GroupTabs = reatomComponent(({ groups, ... }) => {
  const loading = groupsLoadingAtom()
  const error = groupsErrorAtom()

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex-1">
        <ContentState
          loading={loading}
          error={error}
          onRetry={() => loadGroups()}
        >
          {groups.length === 0 ? (
            <span className="text-sm text-muted-foreground">No groups</span>
          ) : (
            <TabsList groups={groups} ... />
          )}
        </ContentState>
      </div>
      <Button onClick={onAddGroup} size="icon" variant="ghost">
        <Plus />
      </Button>
    </div>
  )
}, 'GroupTabs')
```

#### 4.3 Update MainScreen Content Area

**File:** `src/screens/main-screen/main-screen.tsx`

Wrap content with ContentState:

```tsx
// Import new atoms
import { bookmarksLoadingAtom, bookmarksErrorAtom, loadBookmarks } from '@/domain/bookmarks'

// In render:
const bookmarksLoading = bookmarksLoadingAtom()
const bookmarksError = bookmarksErrorAtom()

return (
  <MainLayout sidebar={sidebarSlot} header={headerSlot}>
    <ContentState
      loading={bookmarksLoading}
      error={bookmarksError}
      onRetry={() => loadBookmarks()}
      loadingMessage="Loading bookmarks..."
    >
      {emptyState ? (
        <EmptyState type={emptyState} onAction={...} />
      ) : (
        <BookmarkGrid bookmarks={bookmarks} ... />
      )}
    </ContentState>
  </MainLayout>
)
```

---

### Phase 5: Initial App Shell Loading

Handle the pre-auth loading state (while Clerk initializes).

#### 5.1 Create AppShellLoading

**File:** `src/app/auth/app-shell-loading.tsx` (new)

Static shell matching final layout structure exactly:

```tsx
import { Spinner } from '@/shared/ui'

export function AppShellLoading() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar placeholder - exact width as real sidebar */}
      <aside className="flex w-16 flex-col border-r border-border bg-sidebar">
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="sm" />
        </div>
      </aside>

      {/* Main area */}
      <main className="flex flex-1 flex-col">
        {/* Header placeholder */}
        <header className="flex h-12 items-center border-b border-border bg-background" />

        {/* Content placeholder */}
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" message="Loading..." />
        </div>
      </main>
    </div>
  )
}
```

#### 5.2 Update AuthGuard

**File:** `src/app/auth/auth-guard.tsx`

Handle Clerk loading state:

```tsx
import { useAuth } from '@clerk/chrome-extension'
import { AppShellLoading } from './app-shell-loading'

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded } = useAuth()

  // Show app shell while Clerk initializes
  if (!isLoaded) {
    return <AppShellLoading />
  }

  return (
    <>
      <SignedOut>
        <AuthScreen />
      </SignedOut>
      <SignedIn>
        <ClerkUserSync>{children}</ClerkUserSync>
      </SignedIn>
    </>
  )
}
```

---

### Phase 6: Cleanup & Exports

#### 6.1 Remove Duplicate LoadingScreen

**Delete:** `src/components/ui/loading-screen.tsx`

Keep only `src/shared/ui/kit/loading-screen.tsx`.

#### 6.2 Update Kit Exports

**File:** `src/shared/ui/kit/index.ts`

Add exports for new components:

```typescript
export { Spinner } from './spinner'
export { InlineError } from './inline-error'
export { ContentState } from './content-state'
```

#### 6.3 Update Auth Exports

**File:** `src/app/auth/index.ts`

Add export for AppShellLoading:

```typescript
export { AppShellLoading } from './app-shell-loading'
```

---

## File Summary

### New Files (4)

| File                                  | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `src/shared/ui/kit/spinner.tsx`       | Minimal centered spinner component |
| `src/shared/ui/kit/inline-error.tsx`  | Compact inline error display       |
| `src/shared/ui/kit/content-state.tsx` | Loading/error/content wrapper      |
| `src/app/auth/app-shell-loading.tsx`  | Initial app shell placeholder      |

### Modified Files (10)

| File                                            | Changes                                          |
| ----------------------------------------------- | ------------------------------------------------ |
| `src/stores/auth/data-atoms.ts`                 | Add `retryCountAtom`, `retryLoadData` action     |
| `src/app/auth/clerk-user-sync.tsx`              | Add auto-retry logic with exponential backoff    |
| `src/app/auth/auth-guard.tsx`                   | Handle Clerk `isLoaded` state                    |
| `src/domain/spaces/spaces.model.ts`             | Add `spacesErrorAtom`, update `loadSpaces`       |
| `src/domain/spaces/index.ts`                    | Export `spacesErrorAtom`                         |
| `src/domain/groups/groups.model.ts`             | Add `groupsErrorAtom`, update `loadGroups`       |
| `src/domain/groups/index.ts`                    | Export `groupsErrorAtom`                         |
| `src/domain/bookmarks/bookmarks.model.ts`       | Add `bookmarksErrorAtom`, update `loadBookmarks` |
| `src/domain/bookmarks/index.ts`                 | Export `bookmarksErrorAtom`                      |
| `src/screens/main-screen/ui/spaces-sidebar.tsx` | Integrate `ContentState`                         |
| `src/screens/main-screen/ui/group-tabs.tsx`     | Integrate `ContentState`                         |
| `src/screens/main-screen/main-screen.tsx`       | Wrap content with `ContentState`                 |
| `src/shared/ui/kit/index.ts`                    | Export new components                            |

### Deleted Files (1)

| File                                   | Reason                   |
| -------------------------------------- | ------------------------ |
| `src/components/ui/loading-screen.tsx` | Duplicate of kit version |

---

## Auto-Retry Behavior

```
Initial load fails
  └─> Wait 2s → Retry #1
        └─> Fails → Wait 4s → Retry #2
              └─> Fails → Wait 8s → Retry #3
                    └─> Fails → Show error with manual retry button
                    └─> Success → Silent transition to content
```

- During retry: Spinner continues showing (no error flash)
- After max retries: Show error UI with "Retry" button
- Manual retry: Always available via button
- Success: Silent transition, no toast/notification

---

## Implementation Order

1. **Phase 1**: State infrastructure (atoms, retry logic)
2. **Phase 2**: Create reusable UI components (Spinner, InlineError, ContentState)
3. **Phase 3**: Add error atoms to domains
4. **Phase 4**: Update UI components to use ContentState
5. **Phase 5**: Add app shell loading for Clerk init
6. **Phase 6**: Cleanup and exports

---

## Testing Checklist

- [ ] Initial load shows app shell, then content appears without layout shift
- [ ] Spaces sidebar shows spinner while loading
- [ ] Group tabs show spinner while loading
- [ ] Bookmark grid shows spinner while loading
- [ ] Network error triggers auto-retry (up to 3 times)
- [ ] After max retries, error UI appears with retry button
- [ ] Manual retry works from error state
- [ ] Successful retry silently transitions to content
- [ ] Each section loads/errors independently
