// UI actions for navigation, modal, and theme operations
import { action } from '@reatom/core'
import {
  activeSpaceIdAtom,
  selectedGroupIdAtom,
  modalTypeAtom,
  modalEntityAtom,
  themeAtom,
  applyTheme,
  sidebarCollapsedAtom,
  setSidebarCollapsed as persistSidebarCollapsed,
  editingSpaceIdAtom,
  editingGroupIdAtom,
  draftSpaceAtom,
  draftGroupAtom,
  editingSpaceStateAtom,
  editingGroupStateAtom
} from './atoms'
import type { ModalType, Space, Group, Bookmark } from '@/types'
import type { Theme, DraftSpace, DraftGroup } from './atoms'

// Navigation actions
export const setActiveSpace = action((spaceId: string | null) => {
  activeSpaceIdAtom.set(spaceId)
  selectedGroupIdAtom.set(null) // Reset group when space changes
}, 'ui.setActiveSpace')

export const setSelectedGroup = action((groupId: string | null) => {
  selectedGroupIdAtom.set(groupId)
}, 'ui.setSelectedGroup')

// Modal actions
export const openModal = action((type: ModalType, entity?: Space | Group | Bookmark) => {
  modalTypeAtom.set(type)
  modalEntityAtom.set(entity ?? null)
}, 'ui.openModal')

export const closeModal = action(() => {
  modalTypeAtom.set(null)
  modalEntityAtom.set(null)
}, 'ui.closeModal')

// Theme actions
export const setTheme = action((theme: Theme) => {
  themeAtom.set(theme)
  applyTheme(theme)
}, 'ui.setTheme')

// Sidebar actions
export const toggleSidebar = action(() => {
  const current = sidebarCollapsedAtom()
  sidebarCollapsedAtom.set(!current)
  persistSidebarCollapsed(!current)
}, 'ui.toggleSidebar')

export const setSidebarCollapsed = action((collapsed: boolean) => {
  sidebarCollapsedAtom.set(collapsed)
  persistSidebarCollapsed(collapsed)
}, 'ui.setSidebarCollapsed')

// Inline editing actions
export const setEditingSpaceId = action((id: string | null) => {
  editingSpaceIdAtom.set(id)
}, 'ui.setEditingSpaceId')

export const setEditingGroupId = action((id: string | null) => {
  editingGroupIdAtom.set(id)
}, 'ui.setEditingGroupId')

// Draft actions for optimistic creation
export const setDraftSpace = action((draft: DraftSpace | null) => {
  draftSpaceAtom.set(draft)
  if (draft) {
    editingSpaceIdAtom.set(draft.id)
  }
}, 'ui.setDraftSpace')

export const clearDraftSpace = action(() => {
  draftSpaceAtom.set(null)
  editingSpaceIdAtom.set(null)
}, 'ui.clearDraftSpace')

export const setDraftGroup = action((draft: DraftGroup | null) => {
  draftGroupAtom.set(draft)
  if (draft) {
    editingGroupIdAtom.set(draft.id)
  }
}, 'ui.setDraftGroup')

export const clearDraftGroup = action(() => {
  draftGroupAtom.set(null)
  editingGroupIdAtom.set(null)
}, 'ui.clearDraftGroup')

// Inline editing actions for existing entities (stores original values for revert)
export const startEditingSpace = action((space: Space) => {
  editingSpaceIdAtom.set(space.id)
  editingSpaceStateAtom.set({
    id: space.id,
    originalName: space.name,
    originalIcon: space.icon
  })
}, 'ui.startEditingSpace')

export const cancelEditingSpace = action(() => {
  editingSpaceIdAtom.set(null)
  editingSpaceStateAtom.set(null)
}, 'ui.cancelEditingSpace')

export const finishEditingSpace = action(() => {
  editingSpaceIdAtom.set(null)
  editingSpaceStateAtom.set(null)
}, 'ui.finishEditingSpace')

export const startEditingGroup = action((group: Group) => {
  editingGroupIdAtom.set(group.id)
  editingGroupStateAtom.set({
    id: group.id,
    originalName: group.name,
    originalIcon: group.icon || ''
  })
}, 'ui.startEditingGroup')

export const cancelEditingGroup = action(() => {
  editingGroupIdAtom.set(null)
  editingGroupStateAtom.set(null)
}, 'ui.cancelEditingGroup')

export const finishEditingGroup = action(() => {
  editingGroupIdAtom.set(null)
  editingGroupStateAtom.set(null)
}, 'ui.finishEditingGroup')
