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

// Create the raw tRPC client without type constraints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trpcClient: any = createTRPCClient({
  links: [
    httpBatchLink({
      url: process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000/trpc',
      async headers() {
        const token = await getAuthToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
      }
    })
  ]
})

/**
 * Typed API client for making API calls
 *
 * Uses AppRouter type from @bookmarks/shared-types for full type safety.
 * The client structure:
 * - api.spaces.{list, create, update, delete, reorder}
 * - api.groups.{list, create, update, delete, reorder}
 * - api.bookmarks.{list, create, update, delete, reorder, move}
 * - api.sync.{ensureUser, status}
 */
export const api = trpcClient as AppRouter

/**
 * Type-safe error checking for tRPC errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTRPCError(error: unknown): error is TRPCClientError<any> {
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

// Re-export types from shared-types for convenience
export type { AppRouter }
