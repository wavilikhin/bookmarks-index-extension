// Spaces hook
import { useDataStore } from "@/stores/data-store"
import { useUIStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import type { CreateSpaceInput, UpdateSpaceInput } from "@/types"

/**
 * useSpaces - Returns all non-archived spaces
 */
export function useSpaces() {
  const spaces = useDataStore((state) => state.spaces)
  return spaces.sort((a, b) => a.order - b.order)
}

/**
 * useActiveSpace - Returns the currently active space
 */
export function useActiveSpace() {
  const activeSpaceId = useUIStore((state) => state.activeSpaceId)
  const getSpaceById = useDataStore((state) => state.getSpaceById)
  
  return activeSpaceId ? getSpaceById(activeSpaceId) : undefined
}

/**
 * useSpaceActions - Returns CRUD actions for spaces
 */
export function useSpaceActions() {
  const user = useAuthStore((state) => state.user)
  const createSpace = useDataStore((state) => state.createSpace)
  const updateSpace = useDataStore((state) => state.updateSpace)
  const deleteSpace = useDataStore((state) => state.deleteSpace)
  const reorderSpaces = useDataStore((state) => state.reorderSpaces)
  const setActiveSpace = useUIStore((state) => state.setActiveSpace)

  return {
    createSpace: async (input: CreateSpaceInput) => {
      if (!user) throw new Error("User not authenticated")
      return createSpace(user.id, input)
    },
    updateSpace: async (id: string, input: UpdateSpaceInput) => {
      return updateSpace(id, input)
    },
    deleteSpace: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteSpace(user.id, id, hard)
    },
    reorderSpaces: async (orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderSpaces(user.id, orderedIds)
    },
    setActiveSpace,
  }
}
