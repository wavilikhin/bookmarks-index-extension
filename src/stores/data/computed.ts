// Computed values for data queries
import { computed } from "@reatom/core";
import { spacesAtom, groupsAtom, bookmarksAtom } from "./atoms";

/**
 * Get sorted spaces by order
 */
export const sortedSpacesAtom = computed(
  () => [...spacesAtom()].sort((a, b) => a.order - b.order),
  "data.sortedSpaces",
);

/**
 * Get space by ID
 */
export function getSpaceById(id: string) {
  return computed(
    () => spacesAtom().find((s) => s.id === id),
    `data.spaceById.${id}`,
  );
}

/**
 * Get groups by space ID (sorted by order)
 */
export function getGroupsBySpaceId(spaceId: string) {
  return computed(
    () =>
      groupsAtom()
        .filter((g) => g.spaceId === spaceId)
        .sort((a, b) => a.order - b.order),
    `data.groupsBySpace.${spaceId}`,
  );
}

/**
 * Get bookmarks by group ID (sorted by order)
 */
export function getBookmarksByGroupId(groupId: string) {
  return computed(
    () =>
      bookmarksAtom()
        .filter((b) => b.groupId === groupId)
        .sort((a, b) => a.order - b.order),
    `data.bookmarksByGroup.${groupId}`,
  );
}
