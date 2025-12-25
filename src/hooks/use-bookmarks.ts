// Bookmarks hook
import { useDataStore } from "@/stores/data-store"
import { useAuthStore } from "@/stores/auth-store"
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@/types"

/**
 * useBookmarks - Returns bookmarks for a specific group
 */
export function useBookmarks(groupId: string | null) {
  const getBookmarksByGroup = useDataStore((state) => state.getBookmarksByGroup)
  
  if (!groupId) return []
  return getBookmarksByGroup(groupId)
}

/**
 * useBookmarkActions - Returns CRUD actions for bookmarks
 */
export function useBookmarkActions() {
  const user = useAuthStore((state) => state.user)
  const createBookmark = useDataStore((state) => state.createBookmark)
  const updateBookmark = useDataStore((state) => state.updateBookmark)
  const deleteBookmark = useDataStore((state) => state.deleteBookmark)
  const reorderBookmarks = useDataStore((state) => state.reorderBookmarks)

  return {
    createBookmark: async (input: CreateBookmarkInput) => {
      if (!user) throw new Error("User not authenticated")
      return createBookmark(user.id, input)
    },
    updateBookmark: async (id: string, input: UpdateBookmarkInput) => {
      return updateBookmark(id, input)
    },
    deleteBookmark: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteBookmark(user.id, id, hard)
    },
    reorderBookmarks: async (groupId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderBookmarks(user.id, groupId, orderedIds)
    },
  }
}
