// UI state store
import { create } from "zustand"
import type { ModalType, Space, Group, Bookmark } from "@/types"

type Theme = "light" | "dark" | "system"

interface UIState {
  // Navigation state
  activeSpaceId: string | null
  selectedGroupId: string | null

  // Modal state
  modalType: ModalType
  modalEntity: Space | Group | Bookmark | null

  // Theme
  theme: Theme

  // Navigation actions
  setActiveSpace: (spaceId: string | null) => void
  setSelectedGroup: (groupId: string | null) => void

  // Modal actions
  openModal: (type: ModalType, entity?: Space | Group | Bookmark) => void
  closeModal: () => void

  // Theme actions
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

const THEME_STORAGE_KEY = "bookmarks-index-theme"

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  activeSpaceId: null,
  selectedGroupId: null,
  modalType: null,
  modalEntity: null,
  theme: "system",

  // Navigation actions
  setActiveSpace: (spaceId: string | null) => {
    set({ activeSpaceId: spaceId, selectedGroupId: null })
  },

  setSelectedGroup: (groupId: string | null) => {
    set({ selectedGroupId: groupId })
  },

  // Modal actions
  openModal: (type: ModalType, entity?: Space | Group | Bookmark) => {
    set({ modalType: type, modalEntity: entity ?? null })
  },

  closeModal: () => {
    set({ modalType: null, modalEntity: null })
  },

  // Theme actions
  setTheme: (theme: Theme) => {
    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    // Apply theme to document
    applyTheme(theme)

    set({ theme })
  },

  initializeTheme: () => {
    // Read from localStorage or default to system
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const theme = stored ?? "system"

    // Apply theme to document
    applyTheme(theme)

    set({ theme })
  },
}))

// Helper to apply theme class to document
function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === "dark") {
    root.classList.add("dark")
  } else if (theme === "light") {
    root.classList.remove("dark")
  } else {
    // System preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", isDark)
  }
}

// Listen for system theme changes when using "system" preference
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      const { theme } = useUIStore.getState()
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches)
      }
    })
}
