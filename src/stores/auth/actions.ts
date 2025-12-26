// Auth actions for authentication operations
import { action, wrap, withAsync } from "@reatom/core";
import { userAtom } from "./atoms";
import {
  getCurrentUserId,
  setCurrentUserId,
  clearCurrentUserId,
  getUser,
  setUser,
} from "@/lib/storage/idb";
import { createTimestamps } from "@/lib/utils/entity";
import type { User, UserSettings } from "@/types";

/**
 * Initialize auth - check for existing session on app start
 */
export const initializeAuth = action(async () => {
  const currentUserId = await wrap(getCurrentUserId());

  if (!currentUserId) {
    return;
  }

  const user = await wrap(getUser(currentUserId));
  if (!user) {
    return;
  }

  userAtom.set(user);
}, "auth.initialize").extend(withAsync());

/**
 * Login - create or find existing user by username
 */
export const login = action(async (username: string) => {
  // Generate a deterministic user ID from username
  // This allows the same username to access the same data
  const userId = `user_${username.toLowerCase()}`;
  console.log("login", userId);

  // Check if user exists
  let user = await wrap(getUser(userId));

  if (!user) {
    console.log("login", "user not found, creating new user");
    // Create new user
    user = {
      id: userId,
      username,
      settings: {
        theme: "system",
      },
      ...createTimestamps(),
    };
    console.log("login", "user created", user);
    await wrap(setUser(user));
  }

  // Set session
  console.log("login", "setting session", userId);
  await wrap(setCurrentUserId(userId));
  userAtom.set(user);
}, "auth.login").extend(withAsync());

/**
 * Logout - clear session but preserve data
 */
export const logout = action(async () => {
  await wrap(clearCurrentUserId());
  userAtom.set(null);
}, "auth.logout").extend(withAsync());

/**
 * Update user settings (e.g., theme preference)
 */
export const updateSettings = action(
  async (newSettings: Partial<UserSettings>) => {
    const user = userAtom();
    if (!user) return;

    const updatedUser: User = {
      ...user,
      settings: { ...user.settings, ...newSettings },
      updatedAt: new Date().toISOString(),
    };

    await wrap(setUser(updatedUser));
    userAtom.set(updatedUser);
  },
  "auth.updateSettings",
).extend(withAsync());
