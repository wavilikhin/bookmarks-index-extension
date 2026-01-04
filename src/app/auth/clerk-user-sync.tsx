import * as React from 'react'
import { useAuth, useUser } from '@clerk/chrome-extension'

import { userIdAtom } from '@/stores'
import { dataLoadingAtom, dataLoadedAtom, dataErrorAtom } from '@/stores/auth/data-atoms'
import { checkMigration, migrationDialogOpenAtom } from '@/stores/migration'
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
 * Check for migration needs and handle accordingly
 */
async function handleMigrationCheck(
  userId: string,
  email?: string,
  name?: string,
  avatarUrl?: string
): Promise<boolean> {
  try {
    // First ensure user exists on server
    await api.sync.ensureUser.mutate({
      email: email,
      name: name,
      avatarUrl: avatarUrl
    })

    // Check if migration is needed
    const result = await checkMigration(userId)

    // If migration dialog is shown, don't load data yet
    // Data will be loaded after migration completes
    return result.shouldShowDialog
  } catch (error) {
    console.error('Failed to check migration:', error)
    return false
  }
}

/**
 * ClerkUserSync - Syncs Clerk authentication state to Reatom userIdAtom
 *
 * This component bridges Clerk's authentication with our Reatom data layer.
 * When a user signs in/out via Clerk, it updates userIdAtom and loads/clears data.
 *
 * Migration flow:
 * 1. User signs in
 * 2. Check if user has local IndexedDB data
 * 3. If yes, show migration dialog and wait for user choice
 * 4. After migration (or if no local data), load data from server
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

      // Check for migration first, then load data
      const email = user?.primaryEmailAddress?.emailAddress
      const name = user?.fullName ?? undefined
      const avatarUrl = user?.imageUrl

      handleMigrationCheck(userId, email, name, avatarUrl).then((showingMigration) => {
        // If migration dialog is not shown, load data immediately
        if (!showingMigration) {
          loadUserData(email, name, avatarUrl)
        }
      })
    }
  }, [userId, isLoaded, user])

  // Subscribe to migration dialog close to load data after migration
  React.useEffect(() => {
    // Create a simple subscription to watch for migration completion
    const checkAndLoad = () => {
      const dialogOpen = migrationDialogOpenAtom()
      const currentUserId = userIdAtom()
      const loaded = dataLoadedAtom()

      // If dialog just closed and data isn't loaded yet, load it
      if (!dialogOpen && currentUserId && !loaded) {
        const email = user?.primaryEmailAddress?.emailAddress
        const name = user?.fullName ?? undefined
        const avatarUrl = user?.imageUrl
        loadUserData(email, name, avatarUrl)
      }
    }

    // Subscribe to dialog state changes
    const unsubscribe = migrationDialogOpenAtom.subscribe(checkAndLoad)
    return unsubscribe
  }, [user])

  return <>{children}</>
}
