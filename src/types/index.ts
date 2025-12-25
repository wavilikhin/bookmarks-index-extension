// Core entity types for the bookmark management system

// Base entity with common fields
export interface BaseEntity {
  id: string // Prefixed nanoid (e.g., "space_x7k2m9p4")
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// User settings
export interface UserSettings {
  theme: "light" | "dark" | "system"
  defaultSpaceId?: string
}

// User entity
export interface User extends BaseEntity {
  username: string
  email?: string
  avatarUrl?: string
  settings: UserSettings
}

// Space entity
export interface Space extends BaseEntity {
  userId: string
  name: string
  icon: string // Emoji (e.g., "💼")
  color?: string // Optional accent color
  order: number
  isArchived: boolean
}

// Group entity
export interface Group extends BaseEntity {
  userId: string // Denormalized for queries
  spaceId: string
  name: string
  icon?: string
  order: number
  isArchived: boolean
}

// Bookmark entity
export interface Bookmark extends BaseEntity {
  userId: string // Denormalized
  spaceId: string // Denormalized
  groupId: string
  title: string
  url: string
  faviconUrl?: string
  description?: string
  order: number
  isPinned: boolean
  isArchived: boolean
}

// Input types for CRUD operations
export type CreateSpaceInput = Pick<Space, "name" | "icon" | "color">
export type CreateGroupInput = Pick<Group, "spaceId" | "name" | "icon">
export type CreateBookmarkInput = Pick<
  Bookmark,
  "groupId" | "title" | "url" | "description"
>

export type UpdateSpaceInput = Partial<
  Omit<Space, "id" | "userId" | "createdAt">
>
export type UpdateGroupInput = Partial<
  Omit<Group, "id" | "userId" | "createdAt">
>
export type UpdateBookmarkInput = Partial<
  Omit<Bookmark, "id" | "userId" | "createdAt">
>

// UI state types
export type EntityType = "space" | "group" | "bookmark"

export type ModalType =
  | "createSpace"
  | "editSpace"
  | "createGroup"
  | "editGroup"
  | "createBookmark"
  | "editBookmark"
  | "deleteConfirm"
  | "settings"
  | null

export interface ModalState {
  type: ModalType
  entity?: Space | Group | Bookmark
}
