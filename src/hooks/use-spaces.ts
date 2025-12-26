// Spaces hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { useWrap } from "@reatom/react";
import { sortedSpacesAtom, getSpaceById } from "@/stores/data/computed";
import { activeSpaceIdAtom } from "@/stores/ui/atoms";
import { userAtom } from "@/stores/auth/atoms";
import {
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces,
} from "@/stores/data/actions";
import { setActiveSpace } from "@/stores/ui/actions";
import type { CreateSpaceInput, UpdateSpaceInput } from "@/types";

/**
 * useSpaces - Returns all non-archived spaces (sorted)
 * Must be called inside a reatomComponent
 */
export function useSpaces() {
  return sortedSpacesAtom();
}

/**
 * useActiveSpace - Returns the currently active space
 * Must be called inside a reatomComponent
 */
export function useActiveSpace() {
  const activeSpaceId = activeSpaceIdAtom();
  if (!activeSpaceId) return undefined;
  return getSpaceById(activeSpaceId)();
}

/**
 * useSpaceActions - Returns CRUD actions for spaces
 * Must be called inside a reatomComponent to preserve Reatom context
 */
export function useSpaceActions() {
  const user = userAtom();

  // Wrap actions to preserve Reatom context in event handlers
  const wrappedCreateSpace = useWrap(createSpace);
  const wrappedUpdateSpace = useWrap(updateSpace);
  const wrappedDeleteSpace = useWrap(deleteSpace);
  const wrappedReorderSpaces = useWrap(reorderSpaces);

  return {
    createSpace: async (input: CreateSpaceInput) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedCreateSpace(user.id, input);
    },
    updateSpace: async (id: string, input: UpdateSpaceInput) => {
      return wrappedUpdateSpace(id, input);
    },
    deleteSpace: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedDeleteSpace(user.id, id, hard);
    },
    reorderSpaces: async (orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated");
      return wrappedReorderSpaces(user.id, orderedIds);
    },
    setActiveSpace: (spaceId: string | null) => setActiveSpace(spaceId),
  };
}
