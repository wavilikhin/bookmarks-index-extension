import { z } from 'zod'
import { eq, and, asc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

import { router, protectedProcedure } from '../trpc'
import { db } from '../db/client'
import { spaces } from '../db/schema'

export const spacesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(spaces)
      .where(and(eq(spaces.userId, ctx.userId), eq(spaces.isArchived, false)))
      .orderBy(asc(spaces.order))
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [space] = await db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, input.id), eq(spaces.userId, ctx.userId)))
      .limit(1)
    return space ?? null
  }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        icon: z.string().default('📁'),
        color: z.string().optional(),
        order: z.number().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get max order if not provided
      let order = input.order
      if (order === undefined) {
        const result = await db.select().from(spaces).where(eq(spaces.userId, ctx.userId)).orderBy(asc(spaces.order))
        order = result.length
      }

      const [space] = await db
        .insert(spaces)
        .values({
          id: input.id,
          userId: ctx.userId,
          name: input.name,
          icon: input.icon,
          color: input.color,
          order
        })
        .returning()
      return space
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().optional(),
        color: z.string().nullable().optional(),
        isArchived: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [space] = await db
        .update(spaces)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(spaces.id, id), eq(spaces.userId, ctx.userId)))
        .returning()

      if (!space) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Space ${id} not found` })
      }
      return space
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await db.delete(spaces).where(and(eq(spaces.id, input.id), eq(spaces.userId, ctx.userId)))
    return { success: true }
  }),

  reorder: protectedProcedure.input(z.object({ orderedIds: z.array(z.string()) })).mutation(async ({ ctx, input }) => {
    await db.transaction(async (tx) => {
      await Promise.all(
        input.orderedIds.map((id, index) =>
          tx
            .update(spaces)
            .set({ order: index, updatedAt: new Date() })
            .where(and(eq(spaces.id, id), eq(spaces.userId, ctx.userId)))
        )
      )
    })
    return { success: true }
  })
})
