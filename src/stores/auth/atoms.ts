// Auth atoms for user state management
import { atom, computed } from "@reatom/core";
import type { User } from "@/types";

// Core auth state atoms
export const userAtom = atom<User | null>(null, "auth.user");

// Computed auth state - derived from userAtom
export const isAuthenticatedAtom = computed(
  () => userAtom() !== null,
  "auth.isAuthenticated",
);
