// Data atoms for spaces, groups, and bookmarks
import { atom } from "@reatom/core";
import type { Space, Group, Bookmark } from "@/types";

// Entity arrays
export const spacesAtom = atom<Space[]>([], "data.spaces");
export const groupsAtom = atom<Group[]>([], "data.groups");
export const bookmarksAtom = atom<Bookmark[]>([], "data.bookmarks");

// Loading state
export const isDataLoadingAtom = atom(false, "data.isLoading");
