// Theme management hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { themeAtom } from "@/stores/ui/atoms";
import { setTheme } from "@/stores/ui/actions";

/**
 * useTheme - Hook for theme management
 *
 * Returns the current theme and a function to update it.
 * Theme is persisted to localStorage and applied to document root.
 * Must be called inside a reatomComponent
 */
export function useTheme() {
  const theme = themeAtom();

  return {
    theme,
    setTheme: (newTheme: "light" | "dark" | "system") => setTheme(newTheme),
  };
}
