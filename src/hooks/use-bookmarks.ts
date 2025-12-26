// Bookmarks hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { useWrap } from "@reatom/react";
import { getBookmarksByGroupId } from "@/stores/data/computed";
import { userAtom } from "@/stores/auth/atoms";
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
} from "@/stores/data/actions";
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@/types";

/**
 * useBookmarks - Returns bookmarks for a specific group
 * Must be called inside a reatomComponent
 */
export function useBookmarks(groupId: string | null) {
  if (!groupId) return [];
  return getBookmarksByGroupId(groupId)();
}

/**
 * useBookmarkActions - Returns CRUD actions for bookmarks
 * Must be called inside a reatomComponent to preserve Reatom context
 */
export function useBookmarkActions() {
  const user = userAtom();

  // Wrap actions to preserve Reatom context in event handlers
  const wrappedCreateBookmark = useWrap(createBookmark);
  const wrappedUpdateBookmark = useWrap(updateBookmark);
  const wrappedDeleteBookmark = useWrap(deleteBookmark);
  const wrappedReorderBookmarks = useWrap(reorderBookmarks);

  return {
    createBookmark: async (input: CreateBookmarkInput) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedCreateBookmark(user.id, input);
    },
    updateBookmark: async (id: string, input: UpdateBookmarkInput) => {
      return wrappedUpdateBookmark(id, input);
    },
    deleteBookmark: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedDeleteBookmark(user.id, id, hard);
    },
    reorderBookmarks: async (groupId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedReorderBookmarks(user.id, groupId, orderedIds);
    },
  };
}
