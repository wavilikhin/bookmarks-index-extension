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
- `@/stores` - Zustand state stores
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
│   ├── auth-store.ts           # User auth state (login/logout)
│   ├── data-store.ts           # Spaces, Groups, Bookmarks CRUD
│   └── ui-store.ts             # UI state (selections, modals, theme)
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

### State Management (Zustand)

| Store | Purpose | Key State |
|-------|---------|-----------|
| `auth-store` | Authentication | `user`, `isAuthenticated`, `isLoading` |
| `data-store` | Entity CRUD | `spaces`, `groups`, `bookmarks` |
| `ui-store` | UI state | `activeSpaceId`, `selectedGroupId`, `theme` |

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
