# Agent Guidelines

## General rules

- Always keep this file up to date. On any components or architecture updates update this file as well

## UI Framework

This project uses **shadcn/ui** with the **Base-Lyra** style (built on `@base-ui/react` instead of Radix UI).

## Configuration

| Item | Value |
|------|-------|
| Style | `base-lyra` |
| CSS Variables | Enabled (OKLCH colors) |
| TypeScript | Enabled |
| Tailwind CSS | v4 |
| Icon Library | Lucide React |
| Package Manager | **bun** (not npm) |

## Path Aliases

- `@/components` - Components directory
- `@/components/ui` - shadcn/ui components
- `@/components/auth` - Authentication components
- `@/components/new-tab` - Main application components
- `@/lib` - Library utilities
- `@/lib/storage` - IndexedDB storage layer
- `@/lib/utils` - Entity and validation utilities
- `@/hooks` - Custom hooks
- `@/stores` - Reatom state stores
- `@/types` - TypeScript type definitions

## Commands

```bash
# Start dev server (web app mode)
bun dev

# Build for production
bun run build

# Build for Chrome extension
bun run build:extension

# Build with watch mode
bun run build:watch

# Preview production build
bun run preview

# Lint
bun run lint

# Add a new shadcn component
bunx shadcn@latest add <component>
```

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx      # Auth wrapper, loading states, redirects
│   │   └── login-form.tsx      # Username input form
│   ├── new-tab/
│   │   ├── index.tsx           # Main layout, orchestrates all components
│   │   ├── spaces-sidebar.tsx  # Left sidebar with space navigation
│   │   ├── group-tabs.tsx      # Horizontal tabs for groups
│   │   ├── bookmark-grid.tsx   # Grid of bookmark items
│   │   ├── bookmark-item.tsx   # Individual bookmark circle
│   │   ├── user-menu.tsx       # Avatar dropdown with theme/logout
│   │   ├── add-edit-modal.tsx  # CRUD modal for entities
│   │   └── empty-state.tsx     # Empty state messages
│   └── ui/                     # shadcn/ui components (13 installed)
├── hooks/
│   ├── use-spaces.ts           # Space selectors and actions
│   ├── use-groups.ts           # Group selectors and actions
│   ├── use-bookmarks.ts        # Bookmark selectors and actions
│   └── use-theme.ts            # Theme management
├── lib/
│   ├── storage/
│   │   ├── keys.ts             # Storage key constants
│   │   ├── idb.ts              # IndexedDB wrapper (idb-keyval)
│   │   └── seed.ts             # Sample data for new users
│   ├── utils/
│   │   ├── entity.ts           # ID generation, timestamps
│   │   └── validators.ts       # Zod schemas
│   └── utils.ts                # cn() utility
├── stores/
│   ├── auth/
│   │   ├── atoms.ts            # User, isLoading, isInitialized atoms
│   │   └── actions.ts          # initializeAuth, login, logout actions
│   ├── data/
│   │   ├── atoms.ts            # Spaces, Groups, Bookmarks atoms
│   │   ├── computed.ts         # Derived state (getGroupsBySpaceId, etc.)
│   │   └── actions.ts          # CRUD actions for all entities
│   ├── ui/
│   │   ├── atoms.ts            # activeSpaceId, theme, modal state
│   │   └── actions.ts          # setActiveSpace, setTheme, modal actions
│   └── index.ts                # Consolidated re-exports
├── types/
│   └── index.ts                # All TypeScript interfaces
├── App.tsx                     # Root with AuthGuard wrapper
├── main.tsx                    # React entry point
└── index.css                   # Tailwind + CSS variables
```

## Architecture

### Data Flow

```
User Action → Hook → Store → IndexedDB
                ↓
            UI Update
```

### State Management (Reatom)

This project uses **Reatom v1000** for state management with atomic state design.

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `auth/` | Authentication | `userAtom`, `isAuthenticatedAtom`, `login`, `logout` |
| `data/` | Entity CRUD | `spacesAtom`, `groupsAtom`, `bookmarksAtom`, CRUD actions |
| `ui/` | UI state | `activeSpaceIdAtom`, `themeAtom`, `modalTypeAtom` |

#### Reatom Patterns

```typescript
// Atoms - reactive state containers
import { atom, computed, action, wrap } from "@reatom/core"

// Define atoms with initial value and name
export const userAtom = atom<User | null>(null, "auth.user")

// Computed values - derived state
export const isAuthenticatedAtom = computed(
  () => userAtom() !== null,
  "auth.isAuthenticated"
)

// Actions - state mutations (sync or async)
export const login = action(async (username: string) => {
  // Use wrap() for async operations to preserve context
  const user = await wrap(getUser(userId))
  userAtom.set(user)
}, "auth.login")
```

#### React Integration

```typescript
// Use reatomComponent for reactive components
import { reatomComponent } from "@reatom/react"
import { userAtom, isLoadingAtom } from "@/stores"

export const MyComponent = reatomComponent(() => {
  // Call atoms directly inside reatomComponent - they auto-subscribe
  const user = userAtom()
  const isLoading = isLoadingAtom()

  // Call actions directly
  const handleLogin = () => login("username")

  return <div>{user?.username}</div>
}, "MyComponent")
```

#### Setup in main.tsx

> **Note**: This project uses a simplified setup without React StrictMode or explicit context provider.

```typescript
// main.tsx - Minimal setup
import { createRoot } from "react-dom/client"
import App from "./App.tsx"

// No StrictMode - it causes double-effects that break Reatom context
// No reatomContext.Provider - Reatom's default context works with reatomComponent
createRoot(document.getElementById("root")!).render(<App />)
```

**Why no StrictMode?** React StrictMode double-invokes effects in development, which breaks Reatom's context tracking.

**Why no Provider?** The explicit `reatomContext.Provider` was causing initialization issues. Reatom's default global context works reliably with `reatomComponent`.

### Storage Layer (IndexedDB)

- Uses `idb-keyval` with custom store `bookmarks-index-db`
- Keys follow pattern: `bookmarks:{entity}:{userId}`
- All data is user-scoped for multi-user support

### Entity Structure

```
User (user_xxx)
└── Spaces (space_xxx)
    └── Groups (group_xxx)
        └── Bookmarks (bookmark_xxx)
```

| Field | Description |
|-------|-------------|
| `id` | Prefixed nanoid (e.g., `space_abc123`) |
| `userId` | Owner reference (denormalized) |
| `isArchived` | Soft delete flag |
| `createdAt/updatedAt` | ISO 8601 timestamps |

### Hooks API

```typescript
// Spaces
const spaces = useSpaces()
const activeSpace = useActiveSpace()
const { createSpace, updateSpace, deleteSpace } = useSpaceActions()

// Groups
const groups = useGroups(spaceId)
const selectedGroup = useSelectedGroup()
const { createGroup, updateGroup, deleteGroup } = useGroupActions()

// Bookmarks
const bookmarks = useBookmarks(groupId)
const { createBookmark, updateBookmark, deleteBookmark } = useBookmarkActions()

// Theme
const { theme, setTheme } = useTheme()
```

## Installed shadcn/ui Components

- `alert-dialog` - Confirmation dialogs
- `badge` - Status badges
- `button` - Buttons with variants
- `card` - Card containers
- `combobox` - Searchable select
- `dropdown-menu` - Context menus
- `field` - Form field wrapper
- `input` - Text inputs
- `input-group` - Input with addons
- `label` - Form labels
- `select` - Native select
- `separator` - Visual dividers
- `textarea` - Multi-line input

## Best Practices

1. **Always use bun** - Not npm or yarn
2. **Use shadcn CLI** - `bunx shadcn@latest add <component>`
3. **Use path aliases** - `@/components/ui/button` not relative paths
4. **Use hooks** - Don't access stores directly in components
5. **Use cn()** - For conditional Tailwind classes
6. **Follow Base-Lyra patterns** - `render` prop for composition

## Extension vs Web App

Both modes use identical code:
- **Web App**: `bun dev` → http://localhost:5173
- **Extension**: `bun run build:extension` → load `dist/` in Chrome

IndexedDB works in both contexts, data persists across sessions.

---

## MCP: Worklog

Use worklog MCP tools for persistent context across sessions.

### Auto-Use (No Permission Needed)

1. **Session start** → `worklog:summary`
2. **New feature** → `feature:set` with name + description
3. **Create plan** → `plan:set` with steps array
4. **Complete step** → `plan:annotate` with status "completed"
5. **Important decision** → `log:add` type:"decision"
6. **Discovery** → `log:add` type:"discovery"

### Pattern

```
[Start] worklog:summary → load context
[New feature] feature:set → track it
[Plan created] plan:set → save steps
[Work] plan:annotate → update status
[Decisions] log:add → record rationale
```

**Goal**: Seamless session continuity - users feel you "remember everything".
