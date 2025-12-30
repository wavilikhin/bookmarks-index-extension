import { z } from 'zod'
import { eq, count } from 'drizzle-orm'

import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { users, spaces, groups, bookmarks } from '../db/schema'

// Schema for incoming sync data
const spaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string().nullable().optional(),
  order: z.number(),
  isArchived: z.boolean().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional()
})

const groupSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  order: z.number(),
  isArchived: z.boolean().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional()
})

const bookmarkSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  groupId: z.string(),
  title: z.string(),
  url: z.string(),
  faviconUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  order: z.number(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional()
})

export const syncRouter = router({
  // Pull all user data (initial load)
  pull: protectedProcedure.query(async ({ ctx }) => {
    const [userSpaces, userGroups, userBookmarks] = await Promise.all([
      db.select().from(spaces).where(eq(spaces.userId, ctx.userId)),
      db.select().from(groups).where(eq(groups.userId, ctx.userId)),
      db.select().from(bookmarks).where(eq(bookmarks.userId, ctx.userId))
    ])
    return { spaces: userSpaces, groups: userGroups, bookmarks: userBookmarks }
  }),

  // Push local data to server (migration from IndexedDB)
  push: protectedProcedure
    .input(
      z.object({
        spaces: z.array(spaceSchema),
        groups: z.array(groupSchema),
        bookmarks: z.array(bookmarkSchema)
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.transaction(async (tx) => {
        // Ensure user exists
        await tx
          .insert(users)
          .values({
            id: ctx.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoNothing()

        // Insert spaces
        if (input.spaces.length > 0) {
          for (const space of input.spaces) {
            await tx
              .insert(spaces)
              .values({
                id: space.id,
                userId: ctx.userId,
                name: space.name,
                icon: space.icon,
                color: space.color,
                order: space.order,
                isArchived: space.isArchived ?? false,
                createdAt: space.createdAt ? new Date(space.createdAt) : new Date(),
                updatedAt: space.updatedAt ? new Date(space.updatedAt) : new Date()
              })
              .onConflictDoUpdate({
                target: spaces.id,
                set: {
                  name: space.name,
                  icon: space.icon,
                  color: space.color,
                  order: space.order,
                  isArchived: space.isArchived ?? false,
                  updatedAt: new Date()
                }
              })
          }
        }

        // Insert groups
        if (input.groups.length > 0) {
          for (const group of input.groups) {
            await tx
              .insert(groups)
              .values({
                id: group.id,
                userId: ctx.userId,
                spaceId: group.spaceId,
                name: group.name,
                icon: group.icon,
                order: group.order,
                isArchived: group.isArchived ?? false,
                createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
                updatedAt: group.updatedAt ? new Date(group.updatedAt) : new Date()
              })
              .onConflictDoUpdate({
                target: groups.id,
                set: {
                  spaceId: group.spaceId,
                  name: group.name,
                  icon: group.icon,
                  order: group.order,
                  isArchived: group.isArchived ?? false,
                  updatedAt: new Date()
                }
              })
          }
        }

        // Insert bookmarks
        if (input.bookmarks.length > 0) {
          for (const bookmark of input.bookmarks) {
            await tx
              .insert(bookmarks)
              .values({
                id: bookmark.id,
                userId: ctx.userId,
                spaceId: bookmark.spaceId,
                groupId: bookmark.groupId,
                title: bookmark.title,
                url: bookmark.url,
                faviconUrl: bookmark.faviconUrl,
                description: bookmark.description,
                order: bookmark.order,
                isPinned: bookmark.isPinned ?? false,
                isArchived: bookmark.isArchived ?? false,
                createdAt: bookmark.createdAt ? new Date(bookmark.createdAt) : new Date(),
                updatedAt: bookmark.updatedAt ? new Date(bookmark.updatedAt) : new Date()
              })
              .onConflictDoUpdate({
                target: bookmarks.id,
                set: {
                  spaceId: bookmark.spaceId,
                  groupId: bookmark.groupId,
                  title: bookmark.title,
                  url: bookmark.url,
                  faviconUrl: bookmark.faviconUrl,
                  description: bookmark.description,
                  order: bookmark.order,
                  isPinned: bookmark.isPinned ?? false,
                  isArchived: bookmark.isArchived ?? false,
                  updatedAt: new Date()
                }
              })
          }
        }
      })

      return { success: true }
    }),

  // Check if user has server data
  status: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await db.select({ count: count() }).from(spaces).where(eq(spaces.userId, ctx.userId))

    return {
      hasServerData: (result?.count ?? 0) > 0
    }
  }),

  // Ensure user record exists (called on login)
  ensureUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        avatarUrl: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await db
        .insert(users)
        .values({
          id: ctx.userId,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: input.email,
            name: input.name,
            avatarUrl: input.avatarUrl,
            updatedAt: new Date()
          }
        })
        .returning()

      return user
    })
})
