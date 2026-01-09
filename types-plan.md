# Guide: Creating the `@bookmarks/shared-types` Package

This guide walks you through creating a shared TypeScript types package that provides type safety between the Bookmarks Index extension and server repositories.

---

## Overview

**What this package does:**

- Exports the `AppRouter` type for tRPC client/server type inference
- Exports entity types (`Space`, `Group`, `Bookmark`) shared between repos
- Enables type-safe API calls without direct server code dependency

**Prerequisites:**

- GitHub account with access to create repositories
- Bun installed locally
- TypeScript knowledge

---

## Step 1: Create the Repository

```bash
# Create and enter directory
mkdir bookmarks-shared-types
cd bookmarks-shared-types

# Initialize git
git init
```

---

## Step 2: Create `package.json`

Create `package.json` with the following content:

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
  "files": ["dist"],
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

---

## Step 3: Create `tsconfig.json`

Create `tsconfig.json`:

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

---

## Step 4: Create Source Directory

```bash
mkdir src
```

---

## Step 5: Create `src/router.ts`

This is the main file containing all type definitions. Create `src/router.ts`:

```typescript
// AppRouter type definition
// This defines the contract between extension and server

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// ============================================
// Entity Types (shared between client and server)
// ============================================

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

// ============================================
// Router Type Definition
// Mirrors the server router structure for tRPC client
// ============================================

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

// ============================================
// Helper Types
// ============================================

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
```

---

## Step 6: Create `src/index.ts`

Create the public exports file `src/index.ts`:

```typescript
// Public exports
export type { AppRouter, RouterInputs, RouterOutputs, Space, Group, Bookmark } from './router'
```

---

## Step 7: Create `.gitignore`

Create `.gitignore`:

```
node_modules/
dist/
*.log
.DS_Store
```

---

## Step 8: Create `README.md`

Create `README.md`:

```markdown
# @bookmarks/shared-types

Shared TypeScript types for Bookmarks Index extension and server.

## Installation

### From GitHub

\`\`\`bash

# Using bun

bun add @bookmarks/shared-types@github:wavilikhin/bookmarks-shared-types

# Using npm

npm install @bookmarks/shared-types@github:wavilikhin/bookmarks-shared-types
\`\`\`

### With specific version/tag

\`\`\`bash
bun add @bookmarks/shared-types@github:wavilikhin/bookmarks-shared-types#v0.1.0
\`\`\`

## Usage

### In Extension (tRPC Client)

\`\`\`typescript
import type { AppRouter } from '@bookmarks/shared-types'
import { createTRPCClient } from '@trpc/client'

const api = createTRPCClient<AppRouter>({
// ... config
})

// Type-safe API calls
const spaces = await api.spaces.list.query()
\`\`\`

### Entity Types

\`\`\`typescript
import type { Space, Group, Bookmark } from '@bookmarks/shared-types'

function displaySpace(space: Space) {
console.log(space.name)
}
\`\`\`

## Development

\`\`\`bash

# Install dependencies

bun install

# Build

bun run build

# The dist/ folder will contain the compiled types

\`\`\`

## Updating Types

When the server API changes:

1. Update `src/router.ts` with new types
2. Run `bun run build`
3. Commit and push
4. In consumer repos, run `bun update @bookmarks/shared-types`
```

---

## Step 9: Install Dependencies and Build

```bash
# Install dependencies
bun install

# Build the package
bun run build
```

Verify the `dist/` folder was created with:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/router.js`
- `dist/router.d.ts`

---

## Step 10: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: shared types for Bookmarks Index"

# Create repo on GitHub (via CLI or web)
gh repo create bookmarks-shared-types --private --source=. --push

# Or manually:
git remote add origin git@github.com:wavilikhin/bookmarks-shared-types.git
git branch -M main
git push -u origin main
```

---

## Step 11: Verify Installation Works

Test in the extension repo:

```bash
cd /path/to/bookmarks-index-extension

# Install the shared types
bun add @bookmarks/shared-types@github:wavilikhin/bookmarks-shared-types

# Verify TypeScript resolves the types
bun run tsc
```

---

## Maintenance: Updating Types

When the server API changes, follow this workflow:

### 1. Update types in shared-types repo

```bash
cd bookmarks-shared-types

# Edit src/router.ts with new endpoints/types
# Example: Adding a new endpoint
```

### 2. Build and push

```bash
bun run build
git add .
git commit -m "feat: add new endpoint types"
git push
```

### 3. Update consumer repos

```bash
# In extension repo
cd bookmarks-index-extension
bun update @bookmarks/shared-types

# In server repo (if it also uses this package)
cd bookmarks-index-server
bun update @bookmarks/shared-types
```

---

## Optional: Tagging Versions

For more predictable versioning:

```bash
# In shared-types repo
git tag v0.1.0
git push origin v0.1.0

# In consumer repos, pin to version
bun add @bookmarks/shared-types@github:wavilikhin/bookmarks-shared-types#v0.1.0
```

---

## Directory Structure (Final)

```
bookmarks-shared-types/
├── src/
│   ├── router.ts       # All type definitions
│   └── index.ts        # Public exports
├── dist/               # Built output (git-ignored)
│   ├── index.js
│   ├── index.d.ts
│   ├── router.js
│   └── router.d.ts
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Checklist

- [ ] Created repository `bookmarks-shared-types`
- [ ] Added `package.json` with correct exports config
- [ ] Added `tsconfig.json` with declaration output
- [ ] Created `src/router.ts` with all entity and router types
- [ ] Created `src/index.ts` with public exports
- [ ] Added `.gitignore` (exclude `node_modules/` and `dist/`)
- [ ] Added `README.md` with usage instructions
- [ ] Ran `bun install`
- [ ] Ran `bun run build` successfully
- [ ] Pushed to GitHub
- [ ] Verified `bun add` works in extension repo
- [ ] Verified `bun run tsc` passes in extension repo
