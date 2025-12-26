// IndexedDB wrapper using idb-keyval
import { get, set, del, createStore } from "idb-keyval";
import { StorageKeys } from "./keys";
import type { User, Space, Group, Bookmark } from "@/types";

// Create a custom store for our app
const bookmarksStore = createStore("bookmarks-index-db", "bookmarks-store");

// Generic helpers
export async function getItem<T>(key: string): Promise<T | undefined> {
  return get<T>(key, bookmarksStore);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  return set(key, value, bookmarksStore);
}

export async function deleteItem(key: string): Promise<void> {
  return del(key, bookmarksStore);
}

// Entity-specific operations

// Current user ID
export async function getCurrentUserId(): Promise<string | undefined> {
  return getItem<string>(StorageKeys.currentUserId);
}

export async function setCurrentUserId(userId: string): Promise<void> {
  return setItem(StorageKeys.currentUserId, userId);
}

export async function clearCurrentUserId(): Promise<void> {
  return deleteItem(StorageKeys.currentUserId);
}

// User
export async function getUser(userId: string): Promise<User | undefined> {
  return getItem<User>(StorageKeys.user(userId));
}

export async function setUser(user: User): Promise<void> {
  return setItem(StorageKeys.user(user.id), user);
}

// Spaces
export async function getSpaces(userId: string): Promise<Space[]> {
  const spaces = await getItem<Space[]>(StorageKeys.spaces(userId));
  return spaces ?? [];
}

export async function setSpaces(
  userId: string,
  spaces: Space[],
): Promise<void> {
  return setItem(StorageKeys.spaces(userId), spaces);
}

// Groups
export async function getGroups(userId: string): Promise<Group[]> {
  const groups = await getItem<Group[]>(StorageKeys.groups(userId));
  return groups ?? [];
}

export async function setGroups(
  userId: string,
  groups: Group[],
): Promise<void> {
  return setItem(StorageKeys.groups(userId), groups);
}

// Bookmarks
export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  const bookmarks = await getItem<Bookmark[]>(StorageKeys.bookmarks(userId));
  return bookmarks ?? [];
}

export async function setBookmarks(
  userId: string,
  bookmarks: Bookmark[],
): Promise<void> {
  return setItem(StorageKeys.bookmarks(userId), bookmarks);
}

// Clear all user data (for logout with data wipe)
export async function clearUserData(userId: string): Promise<void> {
  await Promise.all([
    deleteItem(StorageKeys.user(userId)),
    deleteItem(StorageKeys.spaces(userId)),
    deleteItem(StorageKeys.groups(userId)),
    deleteItem(StorageKeys.bookmarks(userId)),
  ]);
}
