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
