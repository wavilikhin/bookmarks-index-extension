// Groups hook
import { useDataStore } from "@/stores/data-store"
import { useUIStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import type { CreateGroupInput, UpdateGroupInput } from "@/types"

/**
 * useGroups - Returns groups for a specific space
 */
export function useGroups(spaceId: string | null) {
  const getGroupsBySpace = useDataStore((state) => state.getGroupsBySpace)
  
  if (!spaceId) return []
  return getGroupsBySpace(spaceId)
}

/**
 * useSelectedGroup - Returns the currently selected group
 */
export function useSelectedGroup() {
  const selectedGroupId = useUIStore((state) => state.selectedGroupId)
  const groups = useDataStore((state) => state.groups)
  
  return selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : undefined
}

/**
 * useGroupActions - Returns CRUD actions for groups
 */
export function useGroupActions() {
  const user = useAuthStore((state) => state.user)
  const createGroup = useDataStore((state) => state.createGroup)
  const updateGroup = useDataStore((state) => state.updateGroup)
  const deleteGroup = useDataStore((state) => state.deleteGroup)
  const reorderGroups = useDataStore((state) => state.reorderGroups)
  const setSelectedGroup = useUIStore((state) => state.setSelectedGroup)

  return {
    createGroup: async (input: CreateGroupInput) => {
      if (!user) throw new Error("User not authenticated")
      return createGroup(user.id, input)
    },
    updateGroup: async (id: string, input: UpdateGroupInput) => {
      return updateGroup(id, input)
    },
    deleteGroup: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteGroup(user.id, id, hard)
    },
    reorderGroups: async (spaceId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderGroups(user.id, spaceId, orderedIds)
    },
    setSelectedGroup,
  }
}
