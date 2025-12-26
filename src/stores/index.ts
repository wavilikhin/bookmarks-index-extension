// Consolidated exports for Reatom stores
// This file provides a single import point for all store functionality

// Re-export from @reatom packages for convenience
export {context, clearStack, connectLogger} from "@reatom/core"
export {reatomContext} from "@reatom/react"

// ============================================
// Auth Module
// ============================================
export {userAtom, isAuthenticatedAtom} from "./auth/atoms"

export {initializeAuth, login, logout, updateSettings} from "./auth/actions"

// ============================================
// Data Module
// ============================================
export {spacesAtom, groupsAtom, bookmarksAtom, isDataLoadingAtom} from "./data/atoms"

export {
  sortedSpacesAtom,
  getSpaceById,
  getGroupsBySpaceId,
  getBookmarksByGroupId,
} from "./data/computed"

export {
  loadAllData,
  clearAllData,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
} from "./data/actions"

// ============================================
// UI Module
// ============================================
export {
  activeSpaceIdAtom,
  selectedGroupIdAtom,
  modalTypeAtom,
  modalEntityAtom,
  themeAtom,
} from "./ui/atoms"

export {setActiveSpace, setSelectedGroup, openModal, closeModal, setTheme} from "./ui/actions"
