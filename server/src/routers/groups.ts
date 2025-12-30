import { z } from 'zod'
import { eq, and, asc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { groups } from '../db/schema'

export const groupsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(groups)
      .where(and(eq(groups.userId, ctx.userId), eq(groups.isArchived, false)))
      .orderBy(asc(groups.order))
  }),

  bySpace: protectedProcedure.input(z.object({ spaceId: z.string() })).query(async ({ ctx, input }) => {
    return db
      .select()
      .from(groups)
      .where(and(eq(groups.userId, ctx.userId), eq(groups.spaceId, input.spaceId), eq(groups.isArchived, false)))
      .orderBy(asc(groups.order))
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [group] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, input.id), eq(groups.userId, ctx.userId)))
      .limit(1)
    return group ?? null
  }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        spaceId: z.string(),
        name: z.string().min(1).max(100),
        icon: z.string().optional(),
        order: z.number().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get max order within space if not provided
      let order = input.order
      if (order === undefined) {
        const result = await db
          .select()
          .from(groups)
          .where(and(eq(groups.userId, ctx.userId), eq(groups.spaceId, input.spaceId)))
          .orderBy(asc(groups.order))
        order = result.length
      }

      const [group] = await db
        .insert(groups)
        .values({
          id: input.id,
          userId: ctx.userId,
          spaceId: input.spaceId,
          name: input.name,
          icon: input.icon,
          order
        })
        .returning()
      return group
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().nullable().optional(),
        spaceId: z.string().optional(),
        isArchived: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [group] = await db
        .update(groups)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(groups.id, id), eq(groups.userId, ctx.userId)))
        .returning()

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Group ${id} not found` })
      }
      return group
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await db.delete(groups).where(and(eq(groups.id, input.id), eq(groups.userId, ctx.userId)))
    return { success: true }
  }),

  reorder: protectedProcedure
    .input(z.object({ spaceId: z.string(), orderedIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await db.transaction(async (tx) => {
        await Promise.all(
          input.orderedIds.map((id, index) =>
            tx
              .update(groups)
              .set({ order: index, updatedAt: new Date() })
              .where(and(eq(groups.id, id), eq(groups.userId, ctx.userId), eq(groups.spaceId, input.spaceId)))
          )
        )
      })
      return { success: true }
    })
})
