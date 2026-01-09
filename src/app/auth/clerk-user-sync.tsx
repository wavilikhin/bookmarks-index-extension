import * as React from 'react'
import { useAuth, useUser } from '@clerk/chrome-extension'
import { reatomComponent } from '@reatom/react'

import { userIdAtom } from '@/stores'
import {
  dataLoadedAtom,
  dataLoadingAtom,
  dataErrorAtom,
  retryCountAtom,
  userCredentialsAtom,
  loadUserDataWithRetry,
  retryLoadUserData
} from '@/stores/auth/data-atoms'
import { InlineError } from '@/shared/ui'

/**
 * ClerkUserSync - Syncs Clerk authentication state to Reatom userIdAtom
 *
 * This component bridges Clerk's authentication with our Reatom data layer.
 * When a user signs in/out via Clerk, it updates userIdAtom and loads/clears data.
 * Implements auto-retry with exponential backoff on failures.
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
      retryCountAtom.set(0)
      previousUserIdRef.current = null
      userCredentialsAtom.set({})
      return
    }

    // User signed in - check if this is a new user or same user
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId
      userIdAtom.set(userId)

      // Store credentials for potential retry
      const email = user?.primaryEmailAddress?.emailAddress
      const name = user?.fullName ?? undefined
      const avatarUrl = user?.imageUrl
      userCredentialsAtom.set({ email, name, avatarUrl })

      // Load user data with auto-retry
      loadUserDataWithRetry(email, name, avatarUrl)
    }
  }, [userId, isLoaded, user])

  return <DataSyncStateHandler>{children}</DataSyncStateHandler>
}

/**
 * DataSyncStateHandler - Handles data error states after auth
 *
 * The skeleton UI in AppShellLoading handles loading feedback,
 * so this component only needs to handle:
 * - Error: Shows error message with retry button after max retries
 * - Success: Renders children (which include skeleton states for individual sections)
 */
const DataSyncStateHandler = reatomComponent<{ children: React.ReactNode }>(({ children }) => {
  const dataError = dataErrorAtom()
  const dataLoading = dataLoadingAtom()

  // Show error state with retry if data sync failed after max retries
  if (dataError && !dataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <InlineError message={dataError} onRetry={retryLoadUserData} />
        </div>
      </div>
    )
  }

  // No fullscreen loading - skeleton UI handles loading states
  return <>{children}</>
}, 'DataSyncStateHandler')
