// Authentication store
import { create } from "zustand"
import {
  getCurrentUserId,
  setCurrentUserId,
  clearCurrentUserId,
  getUser,
  setUser,
} from "@/lib/storage/idb"
import { createTimestamps } from "@/lib/utils/entity"
import type { User, UserSettings } from "@/types"

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  login: (username: string) => Promise<void>
  logout: () => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // Initialize - check for existing session
  initialize: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })

    try {
      const currentUserId = await getCurrentUserId()

      if (currentUserId) {
        const user = await getUser(currentUserId)
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          })
          return
        }
      }

      set({ isLoading: false, isInitialized: true })
    } catch (error) {
      console.error("Failed to initialize auth:", error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  // Login - create or find existing user
  login: async (username: string) => {
    set({ isLoading: true })

    try {
      // Generate a deterministic user ID from username
      // This allows the same username to access the same data
      const userId = `user_${username.toLowerCase()}`

      // Check if user exists
      let user = await getUser(userId)

      if (!user) {
        // Create new user
        user = {
          id: userId,
          username,
          settings: {
            theme: "system",
          },
          ...createTimestamps(),
        }
        await setUser(user)
      }

      // Set session
      await setCurrentUserId(userId)

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      console.error("Failed to login:", error)
      set({ isLoading: false })
      throw error
    }
  },

  // Logout - clear session but preserve data
  logout: async () => {
    set({ isLoading: true })

    try {
      await clearCurrentUserId()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    } catch (error) {
      console.error("Failed to logout:", error)
      set({ isLoading: false })
      throw error
    }
  },

  // Update user settings
  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const { user } = get()
    if (!user) return

    try {
      const updatedUser: User = {
        ...user,
        settings: { ...user.settings, ...newSettings },
        updatedAt: new Date().toISOString(),
      }

      await setUser(updatedUser)
      set({ user: updatedUser })
    } catch (error) {
      console.error("Failed to update settings:", error)
      throw error
    }
  },
}))
