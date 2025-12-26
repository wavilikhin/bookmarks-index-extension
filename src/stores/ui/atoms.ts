// UI atoms for navigation, modal, and theme state
import { atom, effect } from "@reatom/core";
import type { ModalType, Space, Group, Bookmark } from "@/types";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "bookmarks-index-theme";

// Navigation state
export const activeSpaceIdAtom = atom<string | null>(null, "ui.activeSpaceId");
export const selectedGroupIdAtom = atom<string | null>(
  null,
  "ui.selectedGroupId",
);

// Modal state
export const modalTypeAtom = atom<ModalType>(null, "ui.modalType");
export const modalEntityAtom = atom<Space | Group | Bookmark | null>(
  null,
  "ui.modalEntity",
);

// Theme state - initialized from localStorage
const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  return stored ?? "system";
};

export const themeAtom = atom<Theme>(getInitialTheme(), "ui.theme");

// Helper to apply theme class to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  }
}

// Effect to apply theme to document and persist to localStorage
effect(() => {
  const theme = themeAtom();

  // Apply theme to document
  applyTheme(theme);

  // Persist to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme);
});

// Listen for system theme changes when using "system" preference
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      const theme = themeAtom();
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    });
}
