# Agent Guidelines

## General Rules

- Always keep this file up to date on any architecture changes
- Use **bun** (not npm/yarn) for all commands

## Commands

### Extension (Frontend)

```bash
bun dev                      # Start dev server (Chrome)
bun dev:firefox              # Start dev server (Firefox)
bun run build                # Build for production (Chrome)
bun run build:firefox        # Build for production (Firefox)
bun run build:all            # Build for both browsers
bun run package              # Package for Chrome Web Store
bun run package:firefox      # Package for Firefox Add-ons
bun run lint                 # Run ESLint
bun run lint:fix             # Fix lint errors
bun run tsc                  # Type check (no emit)
bun run format               # Format with Prettier
bunx shadcn@latest add <c>   # Add shadcn component
```

## Code Style

### Formatting (Prettier)

- Print width: 120
- No semicolons
- Single quotes
- No trailing commas
- Arrow parens: always

### Imports

Order imports in this sequence (separated by blank lines):

```typescript
// 1. External packages
import { atom, action } from '@reatom/core'
import { useWrap } from '@reatom/react'

// 2. Internal aliases (use @/ always, never relative paths)
import { spacesAtom } from '@/stores/data/atoms'
import { generateId } from '@/lib/utils/entity'
import type { Space, CreateSpaceInput } from '@/types'

// 3. Type-only imports use `import type`
import type { Space } from '@/types'
```

### Function Signatures

**Rule: Max 2 positional parameters. Use object for 3+.**

Parameter names must be semantically related to the function name:

```typescript
// GOOD: 2 params with clear names
function updateSpace(spaceId: string, partialSpace: UpdateSpaceInput) {}
function getBookmarksByGroup(groupId: string) {}
function deleteBookmark(bookmarkId: string, hard?: boolean) {}

// GOOD: Options as 3rd param when needed
function deleteGroup(groupId: string, userId: string, options?: { hard?: boolean }) {}

// BAD: Too many positional params
function reorderBookmarks(userId: string, groupId: string, orderedIds: string[]) {}

// GOOD: Use object for 3+ params
function reorderBookmarks(params: { userId: string; groupId: string; orderedIds: string[] }) {}

// BAD: Generic/unclear names
function update(id: string, data: unknown) {}
function process(a: string, b: string, c: boolean) {}
```

### Naming Conventions

| Element     | Convention       | Example                                 |
| ----------- | ---------------- | --------------------------------------- |
| Files       | kebab-case       | `auth-guard.tsx`, `bookmark-item.ts`    |
| Model files | `.model.ts`      | `bookmarks.model.ts`, `groups.model.ts` |
| Types files | `.types.ts`      | `bookmarks.types.ts`, `group.types.ts`  |
| Components  | PascalCase       | `BookmarkItem`, `UserMenu`              |
| Atoms       | camelCase + Atom | `userIdAtom`, `spacesAtom`              |
| Actions     | camelCase verb   | `createSpace`, `loadUserData`           |
| Types       | PascalCase       | `Space`, `CreateSpaceInput`             |
| Constants   | UPPER_SNAKE      | `STORAGE_KEYS`, `MAX_ITEMS`             |

### Types

- Use explicit types for function parameters and return types
- Use `type` for object shapes, `interface` for extendable contracts
- Prefer `Pick`/`Omit`/`Partial` over duplicating type fields
- Use `import type` for type-only imports

```typescript
// Input types pattern
export type CreateSpaceInput = Pick<Space, 'name' | 'icon' | 'color'>
export type UpdateSpaceInput = Partial<Omit<Space, 'id' | 'userId' | 'createdAt'>>
```

### Error Handling

- Throw descriptive errors for invalid state
- Use early returns for guard clauses
- Check authentication before operations

```typescript
export const createSpace = action(async (input: CreateSpaceInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')
  // ...
}, 'data.createSpace')
```

### Reatom Patterns

```typescript
// Atoms with type and name
export const userIdAtom = atom<string | null>(null, 'auth.userId')

// Computed values
export const isAuthenticatedAtom = computed(() => userIdAtom() !== null, 'auth.isAuthenticated')

// Actions with descriptive names
export const loadUserData = action(async (userId: string) => {
  userIdAtom.set(userId)
  await wrap(loadAllData(userId))
}, 'auth.loadUserData')
  // Extend async actions
  .extend(withAsync())
```

### React Components

```typescript
// Use reatomComponent for reactive components
export const MyComponent = reatomComponent(() => {
  const userId = userIdAtom()           // Auto-subscribes
  const handleClick = () => someAction() // Call actions directly
  return <div>{userId}</div>
}, 'MyComponent')

// Use useWrap for actions in event handlers
const wrappedAction = useWrap(someAction)
```

## Domain Structure

Each domain entity lives in `src/domain/<entity>/` with a strict file structure:

```
src/domain/<entity>/
├── <entity>.model.ts    # Atoms + Actions (all state & logic)
├── <entity>.types.ts    # Types + Input types
└── index.ts             # Consolidated public exports
```

### Rules

1. **Unique file names** - Use `.model.ts` and `.types.ts` suffixes for easy file search
2. **Single model file** - All atoms and actions for a domain go in one `.model.ts` file
3. **Types separate** - Keep types in `.types.ts`, import with `import type`
4. **Barrel exports** - Each folder has `index.ts` that re-exports public API
5. **No React hooks for atoms** - Use atoms directly in `reatomComponent()`, don't create wrapper hooks

### Example: Bookmarks Domain

```typescript
// bookmarks.types.ts
export interface Bookmark extends BaseEntity { ... }
export type CreateBookmarkInput = Pick<Bookmark, 'spaceId' | 'groupId' | 'title' | 'url'>

// bookmarks.model.ts
export const bookmarksAtom = atom<Atom<Bookmark>[]>([], 'bookmarks.atom')
export const createBookmark = action((input: CreateBookmarkInput) => { ... }, 'bookmarks.create')

// index.ts
export type { Bookmark, CreateBookmarkInput } from './bookmarks.types'
export { bookmarksAtom, createBookmark } from './bookmarks.model'
```

## Path Aliases

| Alias             | Path              |
| ----------------- | ----------------- |
| `@/domain`        | Domain modules    |
| `@/shared/ui`     | UI components     |
| `@/shared/ui/kit` | shadcn primitives |
| `@/lib`           | Utilities         |
| `@/stores`        | Reatom stores     |
| `@/types`         | TypeScript types  |
| `@/api`           | tRPC client       |

## API Client Usage

```typescript
// Import the typed client
import { api } from '@/api'

// In Reatom actions - use api directly
export const loadSpaces = action(async () => {
  const spaces = await api.spaces.list.query()
  spacesAtom.set(spaces.map((s) => atom(s)))
}, 'spaces.load')

export const createSpace = action(async (input: CreateSpaceInput) => {
  const space = await api.spaces.create.mutate(input)
  // ... optimistic updates
}, 'spaces.create')
```

## Tech Stack

### Extension (Frontend)

| Item         | Value                 |
| ------------ | --------------------- |
| Build        | Plasmo Framework      |
| UI Framework | shadcn/ui (Base-Lyra) |
| State        | Reatom v1000          |
| Auth         | Clerk                 |
| Styling      | Tailwind CSS v3       |
| Icons        | Lucide React          |
| API Client   | tRPC Client           |
| React        | React 18              |

## Entity IDs

Use prefixed nanoid: `space_abc123`, `group_xyz789`, `bookmark_def456`

```typescript
import { generateId } from '@/lib/utils/entity'
const id = generateId('space') // "space_x7k2m9p4"
```

## Best Practices

1. **Use path aliases** - `@/stores` not `../../stores`
2. **Use cn()** - For conditional Tailwind classes
3. **Use reatomComponent** - For reactive components
4. **Soft delete** - Use `isArchived` flag, not hard delete by default

## MCP: Worklog

Use worklog MCP tools for session continuity:

1. **Session start** - `worklog:summary`
2. **New feature** - `feature:set` with name + description
3. **Planning** - `plan:set` with steps array
4. **Progress** - `plan:annotate` with status
5. **Decisions** - `log:add` type:"decision"
