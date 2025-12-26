// UI actions for navigation, modal, and theme operations
import { action } from "@reatom/core";
import {
  activeSpaceIdAtom,
  selectedGroupIdAtom,
  modalTypeAtom,
  modalEntityAtom,
  themeAtom,
} from "./atoms";
import type { ModalType, Space, Group, Bookmark } from "@/types";

type Theme = "light" | "dark" | "system";

// Navigation actions
export const setActiveSpace = action((spaceId: string | null) => {
  activeSpaceIdAtom.set(spaceId);
  selectedGroupIdAtom.set(null); // Reset group when space changes
}, "ui.setActiveSpace");

export const setSelectedGroup = action((groupId: string | null) => {
  selectedGroupIdAtom.set(groupId);
}, "ui.setSelectedGroup");

// Modal actions
export const openModal = action(
  (type: ModalType, entity?: Space | Group | Bookmark) => {
    modalTypeAtom.set(type);
    modalEntityAtom.set(entity ?? null);
  },
  "ui.openModal",
);

export const closeModal = action(() => {
  modalTypeAtom.set(null);
  modalEntityAtom.set(null);
}, "ui.closeModal");

// Theme actions
export const setTheme = action((theme: Theme) => {
  themeAtom.set(theme);
}, "ui.setTheme");
