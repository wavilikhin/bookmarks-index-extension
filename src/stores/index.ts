// Consolidated exports for Reatom stores
// This file provides a single import point for all store functionality

// Re-export from @reatom packages for convenience
export { context, clearStack, connectLogger } from '@reatom/core'
export { reatomContext } from '@reatom/react'

// ============================================
// Auth Module
// ============================================
export { userIdAtom, isAuthenticatedAtom } from './auth/atoms'

// ============================================
// UI Module
// ============================================
export { activeSpaceIdAtom, selectedGroupIdAtom, modalTypeAtom, modalEntityAtom, themeAtom, sidebarCollapsedAtom, editingSpaceIdAtom, editingGroupIdAtom, draftSpaceAtom, draftGroupAtom, SPACE_ICONS, GROUP_ICONS, getRandomIcon } from './ui/atoms'
export type { Theme, DraftSpace, DraftGroup } from './ui/atoms'

export { setActiveSpace, setSelectedGroup, openModal, closeModal, setTheme, toggleSidebar, setSidebarCollapsed, setEditingSpaceId, setEditingGroupId, setDraftSpace, clearDraftSpace, setDraftGroup, clearDraftGroup } from './ui/actions'
