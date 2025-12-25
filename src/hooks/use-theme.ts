// Theme management hook
import { useUIStore } from "@/stores/ui-store"

/**
 * useTheme - Hook for theme management
 *
 * Returns the current theme and a function to update it.
 * Theme is persisted to localStorage and applied to document root.
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)

  return { theme, setTheme }
}
