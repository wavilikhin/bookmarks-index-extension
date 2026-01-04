import type { Context as HonoContext } from 'hono'
import { db } from './db/client'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(_opts: FetchCreateContextFnOptions, c: HonoContext) {
  // Get userId from Hono context (set by authMiddleware)
  // This avoids verifying the token twice
  const userId = c.get('userId') ?? null

  return { db, userId }
}

export type Context = Awaited<ReturnType<typeof createContext>>
