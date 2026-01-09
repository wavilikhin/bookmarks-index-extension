// UI atoms for navigation, modal, and theme state
import { atom } from '@reatom/core'
import type { ModalType, Space, Group, Bookmark } from '@/types'

export type Theme = 'light' | 'dark' | 'system'

// Icon presets for random selection
export const SPACE_ICONS = ['📁', '🏠', '💼', '🎯', '📚', '🎨', '🔧', '🌟', '🎮', '📱']
export const GROUP_ICONS = ['📂', '📌', '🔖', '📋', '🗂️']

export function getRandomIcon(icons: string[]): string {
  return icons[Math.floor(Math.random() * icons.length)]
}

const THEME_STORAGE_KEY = 'bookmarks-index-theme'
const SIDEBAR_COLLAPSED_KEY = 'bookmarks-index-sidebar-collapsed'

// Navigation state
export const activeSpaceIdAtom = atom<string | null>(null, 'ui.activeSpaceId')
export const selectedGroupIdAtom = atom<string | null>(null, 'ui.selectedGroupId')

// Sidebar collapsed state
const getInitialSidebarCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

export const sidebarCollapsedAtom = atom<boolean>(getInitialSidebarCollapsed(), 'ui.sidebarCollapsed')

export function setSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsedAtom.set(collapsed)
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
}

// Inline editing state - tracks which space/group is currently being edited
export const editingSpaceIdAtom = atom<string | null>(null, 'ui.editingSpaceId')
export const editingGroupIdAtom = atom<string | null>(null, 'ui.editingGroupId')

// Draft state for optimistic creation (local only, not yet persisted)
export interface DraftSpace {
  id: string // temporary ID like "draft-space"
  name: string
  icon: string
  color?: string
}

export interface DraftGroup {
  id: string // temporary ID like "draft-group"
  spaceId: string
  name: string
  icon?: string
}

export const draftSpaceAtom = atom<DraftSpace | null>(null, 'ui.draftSpace')
export const draftGroupAtom = atom<DraftGroup | null>(null, 'ui.draftGroup')

// Editing state for tracking original values during inline edit (for revert on cancel)
export interface EditingEntityState {
  id: string
  originalName: string
  originalIcon: string
}

export const editingSpaceStateAtom = atom<EditingEntityState | null>(null, 'ui.editingSpaceState')
export const editingGroupStateAtom = atom<EditingEntityState | null>(null, 'ui.editingGroupState')

// Modal state
export const modalTypeAtom = atom<ModalType>(null, 'ui.modalType')
export const modalEntityAtom = atom<Space | Group | Bookmark | null>(null, 'ui.modalEntity')

// Theme state - initialized from localStorage
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  return stored ?? 'system'
}

export const themeAtom = atom<Theme>(getInitialTheme(), 'ui.theme')

// Helper to get resolved theme (system -> actual light/dark)
export function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

// Helper to apply theme class to document
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = getResolvedTheme(theme)

  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Persist to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  // Apply initial theme
  applyTheme(getInitialTheme())

  // Listen for system theme changes when using "system" preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const theme = themeAtom()
    if (theme === 'system') {
      applyTheme(theme)
    }
  })
}
