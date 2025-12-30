# Implementation Plan: Supabase Backend Migration

## Overview

Migrate the bookmarks-index Chrome extension from local IndexedDB storage to a PostgreSQL backend hosted on Supabase (via Coolify on VPS). The solution uses:

- **Hono** - Lightweight web framework for the API server
- **tRPC** - Type-safe API layer with automatic client type inference
- **Drizzle ORM** - Type-safe database operations for PostgreSQL/Supabase
- **Clerk JWT Verification** - Server-side authentication
- **Docker** - Containerized deployment to VPS via Coolify

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   Clerk     │───▶│   tRPC      │───▶│   Reatom Atoms          │  │
│  │   Auth      │    │   Client    │    │   (+ IndexedDB cache)   │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────┘
                             │ HTTP + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Server (Docker on VPS)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   Hono      │───▶│   tRPC      │───▶│   Drizzle ORM           │  │
│  │   Server    │    │   Router    │    │                         │  │
│  └─────────────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│                            │                       │                 │
│                    ┌───────▼───────┐               │                 │
│                    │ Clerk JWT     │               │                 │
│                    │ Verification  │               │                 │
│                    └───────────────┘               │                 │
└────────────────────────────────────────────────────┼─────────────────┘
                                                     │
                                                     ▼
                                         ┌─────────────────────┐
                                         │   Supabase          │
                                         │   PostgreSQL        │
                                         │   (Coolify/VPS)     │
                                         └─────────────────────┘
```

## Project Structure (After Implementation)

```
bookmarks-index/
├── server/                          # NEW: Backend server
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts         # Users table schema
│   │   │   │   ├── spaces.ts        # Spaces table schema
│   │   │   │   ├── groups.ts        # Groups table schema
│   │   │   │   ├── bookmarks.ts     # Bookmarks table schema
│   │   │   │   ├── relations.ts     # Drizzle relations
│   │   │   │   └── index.ts         # Barrel export
│   │   │   ├── client.ts            # Drizzle client setup
│   │   │   └── migrate.ts           # Migration runner
│   │   ├── routers/
│   │   │   ├── spaces.ts            # Spaces CRUD procedures
│   │   │   ├── groups.ts            # Groups CRUD procedures
│   │   │   ├── bookmarks.ts         # Bookmarks CRUD procedures
│   │   │   ├── sync.ts              # Data sync procedures
│   │   │   └── index.ts             # Root appRouter
│   │   ├── lib/
│   │   │   ├── auth.ts              # Clerk JWT verification
│   │   │   └── utils.ts             # Shared utilities
│   │   ├── context.ts               # tRPC context creation
│   │   ├── trpc.ts                  # tRPC initialization
│   │   └── index.ts                 # Server entry point (Hono)
│   ├── drizzle/
│   │   └── migrations/              # SQL migration files
│   ├── drizzle.config.ts            # Drizzle Kit config
│   ├── Dockerfile                   # Container build
│   ├── package.json
│   └── tsconfig.json
│
├── src/                             # Existing extension code
│   ├── api/                         # NEW: tRPC client
│   │   ├── client.ts                # tRPC client setup
│   │   └── index.ts
│   ├── lib/
│   │   └── storage/
│   │       ├── keys.ts              # Existing (keep for cache)
│   │       ├── cache.ts             # NEW: IndexedDB cache layer
│   │       └── migration.ts         # NEW: Local→Server migration
│   ├── domain/
│   │   ├── spaces/
│   │   │   ├── spaces.model.ts      # MODIFY: Add server sync
│   │   │   └── ...
│   │   ├── groups/
│   │   │   └── ...                  # MODIFY: Add server sync
│   │   └── bookmarks/
│   │       └── ...                  # MODIFY: Add server sync
│   └── ...
│
├── package.json                     # MODIFY: Add workspace scripts
└── ...
```

## Implementation Phases

### Phase 1: Server Foundation

**Estimated effort: 4-6 hours**

#### 1.1 Initialize Server Package

Create `/server` folder with its own package.json:

```json
{
  "name": "@bookmarks-index/server",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target node",
    "start": "bun dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@clerk/backend": "^1.0.0",
    "@hono/trpc-server": "^0.3.0",
    "@trpc/server": "^11.0.0",
    "drizzle-orm": "^0.38.0",
    "hono": "^4.0.0",
    "postgres": "^3.4.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "drizzle-kit": "^0.30.0"
  }
}
```

#### 1.2 Database Schema (Drizzle)

**`server/src/db/schema/users.ts`:**

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})
```

**`server/src/db/schema/spaces.ts`:**

```typescript
import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const spaces = pgTable(
  'spaces',
  {
    id: text('id').primaryKey(), // space_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('📁'),
    color: text('color'),
    order: integer('order').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('spaces_user_id_idx').on(table.userId),
    index('spaces_user_order_idx').on(table.userId, table.order)
  ]
)
```

**`server/src/db/schema/groups.ts`:**

```typescript
import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spaces } from './spaces'

export const groups = pgTable(
  'groups',
  {
    id: text('id').primaryKey(), // group_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('groups_user_id_idx').on(table.userId), index('groups_space_id_idx').on(table.spaceId)]
)
```

**`server/src/db/schema/bookmarks.ts`:**

```typescript
import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spaces } from './spaces'
import { groups } from './groups'

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: text('id').primaryKey(), // bookmark_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    url: text('url').notNull(),
    faviconUrl: text('favicon_url'),
    description: text('description'),
    order: integer('order').notNull().default(0),
    isPinned: boolean('is_pinned').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('bookmarks_user_id_idx').on(table.userId),
    index('bookmarks_group_id_idx').on(table.groupId),
    index('bookmarks_url_idx').on(table.url)
  ]
)
```

#### 1.3 Hono Server with tRPC

**`server/src/index.ts`:**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './routers'
import { createContext } from './context'

const app = new Hono()

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']

app.use(
  '/*',
  cors({
    origin: (origin) => {
      // Allow Chrome extension origins (chrome-extension://xxx)
      if (origin?.startsWith('chrome-extension://')) return origin
      // Allow configured origins
      if (allowedOrigins.includes(origin || '')) return origin
      return null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS']
  })
)

// Health check
app.get('/health', (c) => c.text('OK'))

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext
  })
)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch
}
```

#### 1.4 tRPC Setup

**`server/src/trpc.ts`:**

```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})
```

**`server/src/context.ts`:**

```typescript
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { verifyClerkToken } from './lib/auth'
import { db } from './db/client'

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const authHeader = req.headers.get('authorization')
  const { userId } = await verifyClerkToken(authHeader)
  return { db, userId }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

**`server/src/lib/auth.ts`:**

```typescript
import { verifyToken } from '@clerk/backend'

export async function verifyClerkToken(authHeader: string | null) {
  if (!authHeader) return { userId: null }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })
    return { userId: payload.sub }
  } catch {
    return { userId: null }
  }
}
```

---

### Phase 2: tRPC Routers

**Estimated effort: 3-4 hours**

#### 2.1 Spaces Router

**`server/src/routers/spaces.ts`:**

```typescript
import { z } from 'zod'
import { eq, and, asc } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { spaces } from '../db/schema'

export const spacesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(spaces)
      .where(and(eq(spaces.userId, ctx.userId), eq(spaces.isArchived, false)))
      .orderBy(asc(spaces.order))
  }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        icon: z.string().default('📁'),
        color: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [space] = await db
        .insert(spaces)
        .values({
          id: input.id,
          userId: ctx.userId,
          name: input.name,
          icon: input.icon,
          color: input.color,
          order: 0 // Will be calculated
        })
        .returning()
      return space
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().optional(),
        color: z.string().nullable().optional(),
        isArchived: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [space] = await db
        .update(spaces)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(spaces.id, id), eq(spaces.userId, ctx.userId)))
        .returning()
      return space
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await db.delete(spaces).where(and(eq(spaces.id, input.id), eq(spaces.userId, ctx.userId)))
    return { success: true }
  }),

  reorder: protectedProcedure.input(z.object({ orderedIds: z.array(z.string()) })).mutation(async ({ ctx, input }) => {
    await db.transaction(async (tx) => {
      await Promise.all(
        input.orderedIds.map((id, index) =>
          tx
            .update(spaces)
            .set({ order: index, updatedAt: new Date() })
            .where(and(eq(spaces.id, id), eq(spaces.userId, ctx.userId)))
        )
      )
    })
    return { success: true }
  })
})
```

#### 2.2 Groups Router

Similar pattern to spaces router with:

- `list` - all groups for user
- `bySpace` - groups filtered by spaceId
- `create` - create new group
- `update` - update group
- `delete` - delete group
- `reorder` - reorder groups within a space

#### 2.3 Bookmarks Router

Similar pattern with:

- `list` - all bookmarks for user
- `byGroup` - bookmarks filtered by groupId
- `bySpace` - bookmarks filtered by spaceId
- `create` - create new bookmark
- `update` - update bookmark
- `delete` - delete bookmark
- `bulkCreate` - bulk create bookmarks (for import)
- `reorder` - reorder bookmarks within a group

#### 2.4 Sync Router

**`server/src/routers/sync.ts`:**

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { users, spaces, groups, bookmarks } from '../db/schema'
import { eq } from 'drizzle-orm'

export const syncRouter = router({
  // Pull all user data (initial load)
  pull: protectedProcedure.query(async ({ ctx }) => {
    const [userSpaces, userGroups, userBookmarks] = await Promise.all([
      db.select().from(spaces).where(eq(spaces.userId, ctx.userId)),
      db.select().from(groups).where(eq(groups.userId, ctx.userId)),
      db.select().from(bookmarks).where(eq(bookmarks.userId, ctx.userId))
    ])
    return { spaces: userSpaces, groups: userGroups, bookmarks: userBookmarks }
  }),

  // Push local data to server (migration)
  push: protectedProcedure
    .input(
      z.object({
        spaces: z.array(/* space schema */),
        groups: z.array(/* group schema */),
        bookmarks: z.array(/* bookmark schema */)
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.transaction(async (tx) => {
        // Upsert user
        await tx.insert(users).values({ id: ctx.userId }).onConflictDoNothing()

        // Upsert spaces, groups, bookmarks with conflict handling
        // ... implementation details
      })
      return { success: true }
    }),

  // Check if user has server data
  status: protectedProcedure.query(async ({ ctx }) => {
    const [spaceCount] = await db
      .select({ count: sql`count(*)` })
      .from(spaces)
      .where(eq(spaces.userId, ctx.userId))
    return {
      hasServerData: Number(spaceCount.count) > 0
    }
  })
})
```

#### 2.5 Root Router

**`server/src/routers/index.ts`:**

```typescript
import { router } from '../trpc'
import { spacesRouter } from './spaces'
import { groupsRouter } from './groups'
import { bookmarksRouter } from './bookmarks'
import { syncRouter } from './sync'

export const appRouter = router({
  spaces: spacesRouter,
  groups: groupsRouter,
  bookmarks: bookmarksRouter,
  sync: syncRouter
})

export type AppRouter = typeof appRouter
```

---

### Phase 3: Client Integration

**Estimated effort: 3-4 hours**

#### 3.1 tRPC Client Setup

**`src/api/client.ts`:**

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../server/src/routers'

async function getAuthToken(): Promise<string | null> {
  const clerk = window.Clerk
  if (!clerk?.session) return null
  return clerk.session.getToken()
}

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
```

#### 3.2 Update Domain Models

Modify `src/domain/spaces/spaces.model.ts` to use tRPC:

```typescript
import { atom, action, withAsync, withIndexedDb, type Atom } from '@reatom/core'
import { api } from '@/api'
import { StorageKeys } from '@/lib/storage/keys'
import { userIdAtom } from '@/stores/auth/atoms'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'

// Keep IndexedDB as cache layer
export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom').extend(
  withIndexedDb({ key: StorageKeys.spaces(userIdAtom()!) })
)

// Load from server
export const loadSpaces = action(async () => {
  const serverSpaces = await api.spaces.list.query()
  spacesAtom.set(serverSpaces.map((s) => atom(s as Space)))
  return serverSpaces
}, 'spaces.load').extend(withAsync())

// Create with optimistic update
export const createSpace = action(async (input: CreateSpaceInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')

  const newId = generateId('space')
  const optimisticSpace: Space = {
    id: newId,
    userId,
    ...input,
    order: spacesAtom().length,
    isArchived: false,
    ...createTimestamps()
  }

  // Optimistic update
  const optimisticAtom = atom(optimisticSpace)
  spacesAtom.set((curr) => [...curr, optimisticAtom])

  try {
    const serverSpace = await api.spaces.create.mutate({
      id: newId,
      name: input.name,
      icon: input.icon,
      color: input.color
    })
    optimisticAtom.set(serverSpace as Space)
    return serverSpace
  } catch (error) {
    // Rollback on error
    spacesAtom.set((curr) => curr.filter((s) => s !== optimisticAtom))
    throw error
  }
}, 'spaces.create').extend(withAsync())

// Similar pattern for update, delete, reorder...
```

---

### Phase 4: Migration & Sync

**Estimated effort: 2-3 hours**

#### 4.1 Migration Service

**`src/lib/storage/migration.ts`:**

```typescript
import { get, set } from 'idb-keyval'
import { api } from '@/api'
import { StorageKeys } from './keys'

const MIGRATION_KEY = 'bookmarks:migration:status'

export async function checkMigrationNeeded(userId: string): Promise<boolean> {
  const status = await get(`${MIGRATION_KEY}:${userId}`)
  if (status === 'completed') return false

  const localSpaces = await get(StorageKeys.spaces(userId))
  return Array.isArray(localSpaces) && localSpaces.length > 0
}

export async function checkServerHasData(): Promise<boolean> {
  const status = await api.sync.status.query()
  return status.hasServerData
}

export async function migrateToServer(userId: string) {
  const [spaces, groups, bookmarks] = await Promise.all([
    get(StorageKeys.spaces(userId)) || [],
    get(StorageKeys.groups(userId)) || [],
    get(StorageKeys.bookmarks(userId)) || []
  ])

  await api.sync.push.mutate({ spaces, groups, bookmarks })
  await set(`${MIGRATION_KEY}:${userId}`, 'completed')
}

export async function pullFromServer(userId: string) {
  const data = await api.sync.pull.query()
  await Promise.all([
    set(StorageKeys.spaces(userId), data.spaces),
    set(StorageKeys.groups(userId), data.groups),
    set(StorageKeys.bookmarks(userId), data.bookmarks)
  ])
  await set(`${MIGRATION_KEY}:${userId}`, 'completed')
}
```

#### 4.2 Migration Dialog

Add a migration dialog component that shows when user has local data. Options:

- **"Upload my data"** - pushes local data to server
- **"Use cloud data"** - fetches from server, discards local
- **"Keep both"** - merges local and server data (server wins on conflicts)

---

### Phase 5: Docker & Deployment

**Estimated effort: 1-2 hours**

#### 5.1 Dockerfile

**`server/Dockerfile`:**

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "start"]
```

#### 5.2 Environment Variables

**Server (Coolify):**

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
CLERK_SECRET_KEY=sk_live_xxx
ALLOWED_ORIGINS=chrome-extension://your-extension-id
PORT=3000
```

**Extension (`.env`):**

```
VITE_API_URL=https://api.yourdomain.com/trpc
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

---

### Phase 6: Cleanup & Polish

**Estimated effort: 1 hour**

Update root `package.json` with convenience scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "bun run --cwd server dev",
    "dev:all": "bun run --parallel dev dev:server",
    "build": "tsc -b && vite build",
    "build:server": "bun run --cwd server build",
    "db:generate": "bun run --cwd server db:generate",
    "db:migrate": "bun run --cwd server db:migrate",
    "db:studio": "bun run --cwd server db:studio"
  }
}
```

---

## Task Checklist

### Phase 1: Server Foundation

- [x] Create `server/` folder structure
- [x] Initialize `server/package.json` with dependencies
- [x] Create `server/tsconfig.json`
- [x] Create Drizzle schema files (users, spaces, groups, bookmarks, relations)
- [x] Create `drizzle.config.ts`
- [x] Create database client (`db/client.ts`)
- [x] Create Clerk auth verification (`lib/auth.ts`)
- [x] Create tRPC initialization (`trpc.ts`, `context.ts`)
- [x] Create Hono server entry point (`index.ts`)
- [ ] Run initial database migration (requires DATABASE_URL)

### Phase 2: tRPC Routers

- [x] Implement spaces router (list, create, update, delete, reorder)
- [x] Implement groups router (list, bySpace, create, update, delete, reorder)
- [x] Implement bookmarks router (list, byGroup, create, update, delete, reorder, bulkCreate)
- [x] Implement sync router (pull, push, status)
- [x] Create root appRouter and export types

### Phase 3: Client Integration

- [x] Add tRPC client dependencies to root package.json
- [x] Create `src/api/client.ts` with tRPC client setup
- [x] Update `src/domain/spaces/spaces.model.ts` with server sync
- [x] Update `src/domain/groups/groups.model.ts` with server sync
- [x] Update `src/domain/bookmarks/bookmarks.model.ts` with server sync
- [x] Add data loading action on auth completion
- [x] Add environment variable for API URL

### Phase 4: Migration & Sync

- [ ] Create migration service (`src/lib/storage/migration.ts`)
- [ ] Create migration dialog component
- [ ] Integrate migration check into auth flow
- [ ] Remove seed data creation logic

### Phase 5: Docker & Deployment

- [ ] Create `server/Dockerfile`
- [ ] Create `server/.dockerignore`
- [ ] Test Docker build locally
- [ ] Configure Coolify deployment
- [ ] Set up environment variables in Coolify

### Phase 6: Cleanup & Polish

- [ ] Update root `package.json` scripts
- [ ] Update `AGENTS.md` with new architecture
- [ ] Add API URL to extension environment config
- [ ] Test full flow (auth -> load -> CRUD -> sync)

---

## Dependencies to Add

**Server (`server/package.json`):**

```
@clerk/backend
@hono/trpc-server
@trpc/server@^11
drizzle-orm
hono
postgres
zod
drizzle-kit (dev)
@types/bun (dev)
```

**Extension (root `package.json`):**

```
@trpc/client@^11
```

---

## Decisions Made

| Question                    | Decision                                                    |
| --------------------------- | ----------------------------------------------------------- |
| CORS in Production          | Restrict to specific extension ID via `ALLOWED_ORIGINS` env |
| Rate Limiting               | Defer to Stage 2                                            |
| Error Handling UI           | Toast notifications (Stage 2)                               |
| Migration Conflict Strategy | Ask user (Upload / Use Cloud / Keep Both)                   |

---

## Estimated Total Effort

| Phase                        | Estimated Time  |
| ---------------------------- | --------------- |
| Phase 1: Server Foundation   | 4-6 hours       |
| Phase 2: tRPC Routers        | 3-4 hours       |
| Phase 3: Client Integration  | 3-4 hours       |
| Phase 4: Migration & Sync    | 2-3 hours       |
| Phase 5: Docker & Deployment | 1-2 hours       |
| Phase 6: Cleanup & Polish    | 1 hour          |
| **Total**                    | **14-20 hours** |
