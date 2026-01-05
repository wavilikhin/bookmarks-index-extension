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
