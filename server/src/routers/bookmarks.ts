import { z } from 'zod'
import { eq, and, asc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { bookmarks } from '../db/schema'

const bookmarkInputSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  groupId: z.string(),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  faviconUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  order: z.number().optional(),
  isPinned: z.boolean().optional()
})

export const bookmarksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, ctx.userId), eq(bookmarks.isArchived, false)))
      .orderBy(asc(bookmarks.order))
  }),

  byGroup: protectedProcedure.input(z.object({ groupId: z.string() })).query(async ({ ctx, input }) => {
    return db
      .select()
      .from(bookmarks)
      .where(
        and(eq(bookmarks.userId, ctx.userId), eq(bookmarks.groupId, input.groupId), eq(bookmarks.isArchived, false))
      )
      .orderBy(asc(bookmarks.order))
  }),

  bySpace: protectedProcedure.input(z.object({ spaceId: z.string() })).query(async ({ ctx, input }) => {
    return db
      .select()
      .from(bookmarks)
      .where(
        and(eq(bookmarks.userId, ctx.userId), eq(bookmarks.spaceId, input.spaceId), eq(bookmarks.isArchived, false))
      )
      .orderBy(asc(bookmarks.order))
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.userId)))
      .limit(1)
    return bookmark ?? null
  }),

  create: protectedProcedure.input(bookmarkInputSchema).mutation(async ({ ctx, input }) => {
    // Get max order within group if not provided
    let order = input.order
    if (order === undefined) {
      const result = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, ctx.userId), eq(bookmarks.groupId, input.groupId)))
        .orderBy(asc(bookmarks.order))
      order = result.length
    }

    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        id: input.id,
        userId: ctx.userId,
        spaceId: input.spaceId,
        groupId: input.groupId,
        title: input.title,
        url: input.url,
        faviconUrl: input.faviconUrl,
        description: input.description,
        order,
        isPinned: input.isPinned ?? false
      })
      .returning()
    return bookmark
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        url: z.string().url().optional(),
        faviconUrl: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        groupId: z.string().optional(),
        spaceId: z.string().optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [bookmark] = await db
        .update(bookmarks)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, ctx.userId)))
        .returning()

      if (!bookmark) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Bookmark ${id} not found` })
      }
      return bookmark
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await db.delete(bookmarks).where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.userId)))
    return { success: true }
  }),

  bulkCreate: protectedProcedure
    .input(z.object({ bookmarks: z.array(bookmarkInputSchema) }))
    .mutation(async ({ ctx, input }) => {
      if (input.bookmarks.length === 0) return { created: [] }

      const bookmarksToInsert = input.bookmarks.map((b, index) => ({
        id: b.id,
        userId: ctx.userId,
        spaceId: b.spaceId,
        groupId: b.groupId,
        title: b.title,
        url: b.url,
        faviconUrl: b.faviconUrl,
        description: b.description,
        order: b.order ?? index,
        isPinned: b.isPinned ?? false
      }))

      const created = await db.insert(bookmarks).values(bookmarksToInsert).returning()
      return { created }
    }),

  reorder: protectedProcedure
    .input(z.object({ groupId: z.string(), orderedIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await db.transaction(async (tx) => {
        await Promise.all(
          input.orderedIds.map((id, index) =>
            tx
              .update(bookmarks)
              .set({ order: index, updatedAt: new Date() })
              .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, ctx.userId), eq(bookmarks.groupId, input.groupId)))
          )
        )
      })
      return { success: true }
    }),

  // Move bookmark to different group
  move: protectedProcedure
    .input(z.object({ id: z.string(), groupId: z.string(), spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get max order in target group
      const result = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, ctx.userId), eq(bookmarks.groupId, input.groupId)))
        .orderBy(asc(bookmarks.order))
      const newOrder = result.length

      const [bookmark] = await db
        .update(bookmarks)
        .set({
          groupId: input.groupId,
          spaceId: input.spaceId,
          order: newOrder,
          updatedAt: new Date()
        })
        .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, ctx.userId)))
        .returning()

      if (!bookmark) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Bookmark ${input.id} not found` })
      }
      return bookmark
    })
})
