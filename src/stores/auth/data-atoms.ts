// Data loading state atoms
import { atom, wrap } from '@reatom/core'

import { loadSpaces } from '@/domain/spaces'
import { loadGroups } from '@/domain/groups'
import { loadBookmarks } from '@/domain/bookmarks'
import { setActiveSpace, setSelectedGroup } from '@/stores/ui/actions'
import { api } from '@/api'

// Loading state atom for initial data load
export const dataLoadingAtom = atom(false, 'auth.dataLoading')
export const dataLoadedAtom = atom(false, 'auth.dataLoaded')
export const dataErrorAtom = atom<string | null>(null, 'auth.dataError')

// Retry count for exponential backoff
export const retryCountAtom = atom(0, 'auth.retryCount')

// User credentials for retry
interface UserCredentials {
  email?: string
  name?: string
  avatarUrl?: string
}
export const userCredentialsAtom = atom<UserCredentials>({}, 'auth.userCredentials')

const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000

/**
 * Load all user data from server with auto-retry
 */
export async function loadUserDataWithRetry(email?: string, name?: string, avatarUrl?: string) {
  let retries = 0

  while (retries <= MAX_RETRIES) {
    dataLoadingAtom.set(true)
    dataErrorAtom.set(null)

    try {
      // Ensure user exists on server
      await wrap(
        api.sync.ensureUser.mutate({
          email: email,
          name: name,
          avatarUrl: avatarUrl
        })
      )

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

      // Success - reset retry count and mark as loaded
      retryCountAtom.set(0)
      dataLoadedAtom.set(true)
      dataLoadingAtom.set(false)
      return
    } catch (error) {
      retries++
      retryCountAtom.set(retries)

      if (retries > MAX_RETRIES) {
        // Max retries exceeded - show error
        console.error('Failed to load user data after max retries:', error)
        dataErrorAtom.set(error instanceof Error ? error.message : 'Failed to load data')
        dataLoadingAtom.set(false)
        return
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = BASE_DELAY_MS * Math.pow(2, retries - 1)
      console.log(`Retry ${retries}/${MAX_RETRIES} in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Retry loading user data - called from UI retry button
 */
export function retryLoadUserData() {
  const credentials = userCredentialsAtom()
  retryCountAtom.set(0) // Reset retry count for manual retry
  loadUserDataWithRetry(credentials.email, credentials.name, credentials.avatarUrl)
}
