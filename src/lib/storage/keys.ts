// Storage key constants for IndexedDB

export const StorageKeys = {
  currentUserId: "bookmarks:currentUserId",
  user: (userId: string) => `bookmarks:user:${userId}`,
  spaces: (userId: string) => `bookmarks:spaces:${userId}`,
  groups: (userId: string) => `bookmarks:groups:${userId}`,
  bookmarks: (userId: string) => `bookmarks:bookmarks:${userId}`,
} as const

// ID prefixes for different entity types
export const IdPrefixes = {
  user: "user_",
  space: "space_",
  group: "group_",
  bookmark: "bookmark_",
} as const
