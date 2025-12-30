import { router, publicProcedure } from '../trpc'
import { spacesRouter } from './spaces'
import { groupsRouter } from './groups'
import { bookmarksRouter } from './bookmarks'
import { syncRouter } from './sync'

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' }
  }),
  spaces: spacesRouter,
  groups: groupsRouter,
  bookmarks: bookmarksRouter,
  sync: syncRouter
})

export type AppRouter = typeof appRouter
