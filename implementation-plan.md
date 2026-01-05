# Implementation Plan: Extract Chrome Extension from Monorepo

## Overview

**Goal:** Remove server code and create a clean extension-only repo that:
- Uses a shared types package (`@bookmarks/shared-types`) for tRPC type safety
- Keeps Clerk auth (client-side only)
- Removes all migration logic and seed data
- Server URL comes from environment variable

**Related Repos:**
- `bookmarks-index-extension` - This repo (extension only after split)
- `bookmarks-index-server` - Server repo (separate)
- `bookmarks-shared-types` - Shared types package (new)

---

## Pre-requisite: Create Shared Types Package

Before executing the main plan, create a new repo `bookmarks-shared-types`.

### Repository Structure

```
bookmarks-shared-types/
├── src/
│   ├── router.ts         # AppRouter type definition
│   └── index.ts          # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

### File Contents

#### `package.json`

```json
{
  "name": "@bookmarks/shared-types",
  "version": "0.1.0",
  "type": "module",
  "description": "Shared TypeScript types for Bookmarks Index extension and server",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "bun run build"
  },
  "peerDependencies": {
    "@trpc/server": "^11.0.0"
  },
  "devDependencies": {
    "@trpc/server": "^11.0.0",
    "typescript": "~5.9.3"
  }
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### `src/router.ts`

```typescript
// AppRouter type definition
// This defines the contract between extension and server

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// Entity types (shared between client and server)
export interface Space {
  id: string
  userId: string
  name: string
  icon?: string | null
  color?: string | null
  order: number
  isArchived: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Group {
  id: string
  userId: string
  spaceId: string
  name: string
  icon?: string | null
  order: number
  isArchived: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Bookmark {
  id: string
  userId: string
  spaceId: string
  groupId: string
  title: string
  url: string
  faviconUrl?: string | null
  description?: string | null
  order: number
  isPinned: boolean
  isArchived: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

// Router type definition (mirrors server router structure)
// This is a simplified type that matches the tRPC router interface
export type AppRouter = {
  spaces: {
    list: {
      query: () => Promise<Space[]>
    }
    create: {
      mutate: (input: {
        id: string
        name: string
        icon?: string | null
        color?: string | null
        order: number
      }) => Promise<Space>
    }
    update: {
      mutate: (input: {
        id: string
        name?: string
        icon?: string | null
        color?: string | null
        isArchived?: boolean
      }) => Promise<Space>
    }
    delete: {
      mutate: (input: { id: string }) => Promise<{ success: boolean }>
    }
    reorder: {
      mutate: (input: { orderedIds: string[] }) => Promise<{ success: boolean }>
    }
  }
  groups: {
    list: {
      query: () => Promise<Group[]>
    }
    create: {
      mutate: (input: {
        id: string
        spaceId: string
        name: string
        icon?: string | null
        order: number
      }) => Promise<Group>
    }
    update: {
      mutate: (input: {
        id: string
        name?: string
        icon?: string | null
        spaceId?: string
        isArchived?: boolean
      }) => Promise<Group>
    }
    delete: {
      mutate: (input: { id: string }) => Promise<{ success: boolean }>
    }
    reorder: {
      mutate: (input: { spaceId: string; orderedIds: string[] }) => Promise<{ success: boolean }>
    }
  }
  bookmarks: {
    list: {
      query: () => Promise<Bookmark[]>
    }
    create: {
      mutate: (input: {
        id: string
        spaceId: string
        groupId: string
        title: string
        url: string
        description?: string | null
        order: number
      }) => Promise<Bookmark>
    }
    update: {
      mutate: (input: {
        id: string
        title?: string
        url?: string
        description?: string | null
        faviconUrl?: string | null
        groupId?: string
        spaceId?: string
        isPinned?: boolean
        isArchived?: boolean
      }) => Promise<Bookmark>
    }
    delete: {
      mutate: (input: { id: string }) => Promise<{ success: boolean }>
    }
    reorder: {
      mutate: (input: { groupId: string; orderedIds: string[] }) => Promise<{ success: boolean }>
    }
    move: {
      mutate: (input: { id: string; groupId: string; spaceId: string }) => Promise<Bookmark>
    }
  }
  sync: {
    ensureUser: {
      mutate: (input: { email?: string; name?: string; avatarUrl?: string }) => Promise<{ id: string }>
    }
    status: {
      query: () => Promise<{ hasServerData: boolean }>
    }
  }
}

// Helper types for inferring inputs/outputs (if using actual tRPC router)
// These are useful when the server exports the real router
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
```

#### `src/index.ts`

```typescript
// Public exports
export type { AppRouter, RouterInputs, RouterOutputs, Space, Group, Bookmark } from './router'
```

#### `README.md`

```markdown
# @bookmarks/shared-types

Shared TypeScript types for Bookmarks Index extension and server.

## Installation

```bash
bun add @bookmarks/shared-types@github:yourorg/bookmarks-shared-types
```

## Usage

```typescript
import type { AppRouter, Space, Group, Bookmark } from '@bookmarks/shared-types'
```

## Development

```bash
bun install
bun run build
```
```

### Publishing

Since the repo is private, install via GitHub:

```bash
# In extension repo
bun add @bookmarks/shared-types@github:yourorg/bookmarks-shared-types

# Or with specific branch/tag
bun add @bookmarks/shared-types@github:yourorg/bookmarks-shared-types#v0.1.0
```

---

## Phase 1: Delete Server Folder

**Action:** Delete entire `/server` directory

```bash
rm -rf server/
```

**Files removed:**
- `server/drizzle/` - Database migrations
- `server/scripts/` - DB setup scripts
- `server/src/` - All server source code
- `server/.dockerignore`
- `server/.env.example`
- `server/.gitignore`
- `server/bun.lock`
- `server/docker-compose.yml`
- `server/Dockerfile`
- `server/drizzle.config.ts`
- `server/package.json`
- `server/tsconfig.json`

---

## Phase 2: Delete GitHub Workflow

**Action:** Delete server deployment workflow

```bash
rm .github/workflows/deploy-server.yml
```

---

## Phase 3: Delete Migration System

**Action:** Delete migration-related files and folders

```bash
rm src/lib/storage/migration.ts
rm src/lib/storage/seed.ts
rm -rf src/stores/migration/
rm -rf src/components/migration/
```

**Files removed:**
- `src/lib/storage/migration.ts` - IndexedDB to server migration logic
- `src/lib/storage/seed.ts` - Seed data orchestration
- `src/stores/migration/atoms.ts` - Migration state atoms
- `src/stores/migration/index.ts` - Migration store exports
- `src/components/migration/migration-dialog.tsx` - Migration UI

---

## Phase 4: Delete Seed Data Functions

**Action:** Delete seed data from all domains

```bash
rm -rf src/domain/spaces/lib/
rm -rf src/domain/groups/lib/
rm -rf src/domain/bookmarks/lib/
```

**Files removed:**
- `src/domain/spaces/lib/getSeedSpaces.ts`
- `src/domain/spaces/lib/index.ts`
- `src/domain/groups/lib/getSeedGroups.ts`
- `src/domain/groups/lib/index.ts`
- `src/domain/bookmarks/lib/getSeedBookmarks.ts`
- `src/domain/bookmarks/lib/index.ts`

---

## Phase 5: Update API Client

**Action:** Modify `src/api/client.ts` to use shared types package

**Before:**
```typescript
import type { AppRouter } from '../../server/src/routers'
```

**After:**
```typescript
import type { AppRouter } from '@bookmarks/shared-types'
```

**Full file content:**

```typescript
// tRPC client setup for connecting to the backend server
import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client'

import type { AppRouter } from '@bookmarks/shared-types'

// Extend Window to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>
      }
    }
  }
}

/**
 * Get authentication token from Clerk session
 */
async function getAuthToken(): Promise<string | null> {
  const clerk = window.Clerk
  if (!clerk?.session) return null
  return clerk.session.getToken()
}

/**
 * tRPC client instance for making API calls
 */
export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000/trpc',
      async headers() {
        const token = await getAuthToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
      }
    })
  ]
})

/**
 * Type-safe error checking for tRPC errors
 */
export function isTRPCError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError
}

/**
 * Extract error message from tRPC error or unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isTRPCError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

// Re-export AppRouter type for convenience
export type { AppRouter }
```

---

## Phase 6: Update API Index

**Action:** Modify `src/api/index.ts`

**Content:**
```typescript
// API client exports
export { api, isTRPCError, getErrorMessage } from './client'
export type { AppRouter } from '@bookmarks/shared-types'
```

---

## Phase 7: Update Domain Index Files

### `src/domain/spaces/index.ts`

```typescript
// Spaces domain - consolidated exports
export type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'
export {
  spacesAtom,
  spacesLoadingAtom,
  getSpaceById,
  loadSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces
} from './spaces.model'
```

### `src/domain/groups/index.ts`

```typescript
// Groups domain - consolidated exports
export type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'
export {
  groupsAtom,
  groupsLoadingAtom,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups
} from './groups.model'
```

### `src/domain/bookmarks/index.ts`

```typescript
// Bookmarks domain - consolidated exports
export type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './bookmarks.types'
export {
  bookmarksAtom,
  bookmarksLoadingAtom,
  loadBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
  moveBookmark
} from './bookmarks.model'
```

---

## Phase 8: Update Stores Index

**Action:** Modify `src/stores/index.ts` to remove migration exports

**Content:**
```typescript
// Consolidated exports for Reatom stores
// This file provides a single import point for all store functionality

// Re-export from @reatom packages for convenience
export { context, clearStack, connectLogger } from '@reatom/core'
export { reatomContext } from '@reatom/react'

// ============================================
// Auth Module
// ============================================
export { userIdAtom, isAuthenticatedAtom } from './auth/atoms'

// ============================================
// UI Module
// ============================================
export { activeSpaceIdAtom, selectedGroupIdAtom, modalTypeAtom, modalEntityAtom, themeAtom } from './ui/atoms'

export { setActiveSpace, setSelectedGroup, openModal, closeModal, setTheme } from './ui/actions'
```

---

## Phase 9: Update App.tsx

**Action:** Modify `src/app/App.tsx` to remove MigrationDialog

**Content:**
```typescript
import { MainScreen } from '@/screens'
import { AuthGuard } from './auth'

export default function App() {
  return (
    <AuthGuard>
      <MainScreen />
    </AuthGuard>
  )
}
```

---

## Phase 10: Update clerk-user-sync.tsx

**Action:** Simplify `src/app/auth/clerk-user-sync.tsx` to remove migration logic

**Content:**
```typescript
import * as React from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

import { userIdAtom } from '@/stores'
import { dataLoadingAtom, dataLoadedAtom, dataErrorAtom } from '@/stores/auth/data-atoms'
import { loadSpaces } from '@/domain/spaces'
import { loadGroups } from '@/domain/groups'
import { loadBookmarks } from '@/domain/bookmarks'
import { api } from '@/api'
import { setActiveSpace, setSelectedGroup } from '@/stores'

/**
 * Load all user data from server
 */
async function loadUserData(email?: string, name?: string, avatarUrl?: string) {
  dataLoadingAtom.set(true)
  dataErrorAtom.set(null)

  try {
    // Ensure user exists on server
    await api.sync.ensureUser.mutate({
      email: email,
      name: name,
      avatarUrl: avatarUrl
    })

    // Load all data in parallel
    const [spaces, groups] = await Promise.all([loadSpaces(), loadGroups(), loadBookmarks()])

    // Set active space and group if we have data
    if (spaces && spaces.length > 0) {
      setActiveSpace(spaces[0].id)

      // Find first group in active space
      if (groups && groups.length > 0) {
        const firstGroup = groups.find((g) => g.spaceId === spaces[0].id)
        if (firstGroup) {
          setSelectedGroup(firstGroup.id)
        }
      }
    }

    dataLoadedAtom.set(true)
  } catch (error) {
    console.error('Failed to load user data:', error)
    dataErrorAtom.set(error instanceof Error ? error.message : 'Failed to load data')
  } finally {
    dataLoadingAtom.set(false)
  }
}

/**
 * ClerkUserSync - Syncs Clerk authentication state to Reatom userIdAtom
 *
 * This component bridges Clerk's authentication with our Reatom data layer.
 * When a user signs in/out via Clerk, it updates userIdAtom and loads/clears data.
 */
export function ClerkUserSync({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const { user } = useUser()
  const previousUserIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      // User signed out
      userIdAtom.set(null)
      dataLoadedAtom.set(false)
      dataErrorAtom.set(null)
      previousUserIdRef.current = null
      return
    }

    // User signed in - check if this is a new user or same user
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId
      userIdAtom.set(userId)

      // Load user data
      const email = user?.primaryEmailAddress?.emailAddress
      const name = user?.fullName ?? undefined
      const avatarUrl = user?.imageUrl

      loadUserData(email, name, avatarUrl)
    }
  }, [userId, isLoaded, user])

  return <>{children}</>
}
```

---

## Phase 11: Update Storage Keys

**Action:** Simplify `src/lib/storage/keys.ts` to only keep IdPrefixes

**Content:**
```typescript
// ID prefixes for different entity types
export const IdPrefixes = {
  user: 'user_',
  space: 'space_',
  group: 'group_',
  bookmark: 'bookmark_'
} as const
```

---

## Phase 12: Update package.json

**Action:** Remove server scripts and dependencies, add shared-types

**Changes:**

1. **Remove scripts:**
   - `dev:server`
   - `dev:all`
   - `build:server`
   - `build:all`
   - `server:start`
   - `tsc:server`
   - `db:generate`
   - `db:migrate`
   - `db:push`
   - `db:studio`

2. **Remove dependencies:**
   - `idb-keyval`

3. **Add dependencies:**
   - `@bookmarks/shared-types` (from GitHub)

**Final package.json:**
```json
{
  "name": "bookmarks-index",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:extension": "tsc -b && vite build",
    "build:watch": "vite build --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "tsc": "tsc -b --noEmit",
    "format": "prettier --write .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base-ui/react": "^1.0.0",
    "@bookmarks/shared-types": "github:yourorg/bookmarks-shared-types",
    "@clerk/clerk-react": "^5.59.2",
    "@fontsource-variable/inter": "^5.2.8",
    "@reatom/core": "^1000.1.0",
    "@reatom/react": "^1000.0.0",
    "@tailwindcss/vite": "^4.1.17",
    "@trpc/client": "^11.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "eslint-plugin-react-component-name": "^0.1.0",
    "lucide-react": "^0.562.0",
    "nanoid": "^5.1.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "shadcn": "^3.6.2",
    "tailwind-merge": "^3.4.0",
    "tailwindcss": "^4.1.17",
    "ts-pattern": "^5.9.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^25.0.3",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "prettier": "^3.7.4",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4"
  }
}
```

**Note:** Replace `yourorg` with actual GitHub org/username.

---

## Phase 13: Update .gitignore

**Action:** Remove server reference from `.gitignore`

**Before:**
```
.env
server/.env
```

**After:**
```
.env
```

---

## Phase 14: Update AGENTS.md

**Action:** Remove all server-related documentation

**Sections to remove:**
- Server (Backend) commands under "Commands"
- Database commands
- "Server Structure" section
- "tRPC Router Pattern" section
- Server entries from "Tech Stack" tables
- "API Client Usage (Frontend)" can stay but update context

**Updated content structure:**
- Keep: Extension (Frontend) commands
- Keep: Code Style section
- Keep: Domain Structure section
- Keep: Path Aliases (remove @/api if needed)
- Keep: Tech Stack - Extension only
- Keep: Entity IDs section
- Keep: Best Practices
- Update: MCP section (keep worklog, remove server references)

---

## Phase 15: Update README.md

**Action:** Update to reflect extension-only repo

**Key changes:**
- Remove any server references
- Update tech stack (remove server items like Hono, Drizzle, PostgreSQL)
- Keep extension build instructions
- Add note about server being in separate repo
- Update project structure (remove server folder)

---

## Phase 16: Verify Build

**Action:** Run verification commands

```bash
# Install dependencies (after updating package.json)
bun install

# Type check
bun run tsc

# Lint
bun run lint

# Build
bun run build
```

---

## Summary of Changes

| Action | Files/Folders |
|--------|---------------|
| **DELETE** | `server/` (entire folder) |
| **DELETE** | `.github/workflows/deploy-server.yml` |
| **DELETE** | `src/lib/storage/migration.ts` |
| **DELETE** | `src/lib/storage/seed.ts` |
| **DELETE** | `src/stores/migration/` (folder) |
| **DELETE** | `src/components/migration/` (folder) |
| **DELETE** | `src/domain/spaces/lib/` (folder) |
| **DELETE** | `src/domain/groups/lib/` (folder) |
| **DELETE** | `src/domain/bookmarks/lib/` (folder) |
| **MODIFY** | `src/api/client.ts` |
| **MODIFY** | `src/api/index.ts` |
| **MODIFY** | `src/app/App.tsx` |
| **MODIFY** | `src/app/auth/clerk-user-sync.tsx` |
| **MODIFY** | `src/stores/index.ts` |
| **MODIFY** | `src/domain/spaces/index.ts` |
| **MODIFY** | `src/domain/groups/index.ts` |
| **MODIFY** | `src/domain/bookmarks/index.ts` |
| **MODIFY** | `src/lib/storage/keys.ts` |
| **MODIFY** | `package.json` |
| **MODIFY** | `.gitignore` |
| **MODIFY** | `AGENTS.md` |
| **MODIFY** | `README.md` |

---

## Commit Message

```
refactor: extract extension-only code, remove server

- Remove entire server/ directory (moved to bookmarks-index-server repo)
- Remove server deployment GitHub workflow
- Remove migration system (lib, stores, components)
- Remove seed data functions from all domains
- Update API client to use @bookmarks/shared-types package
- Simplify clerk-user-sync to remove migration logic
- Remove idb-keyval dependency (was only used for migration)
- Update package.json scripts (remove server-related)
- Update AGENTS.md and README.md documentation

BREAKING CHANGE: Server code moved to separate repository.
Extension now requires @bookmarks/shared-types package.
```
