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
export { activeSpaceIdAtom, selectedGroupIdAtom, modalTypeAtom, modalEntityAtom, themeAtom } from './ui/atoms'
export type { Theme } from './ui/atoms'

export { setActiveSpace, setSelectedGroup, openModal, closeModal, setTheme } from './ui/actions'
