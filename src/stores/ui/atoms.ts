// UI atoms for navigation, modal, and theme state
import { atom } from '@reatom/core'
import type { ModalType, Space, Group, Bookmark } from '@/types'

export type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'bookmarks-index-theme'

// Navigation state
export const activeSpaceIdAtom = atom<string | null>(null, 'ui.activeSpaceId')
export const selectedGroupIdAtom = atom<string | null>(null, 'ui.selectedGroupId')

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
