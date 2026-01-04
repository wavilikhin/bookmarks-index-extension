import * as Sentry from '@sentry/bun'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './routers'
import { createContext } from './context'
import { logger } from './lib/logger'
import { requestLogger } from './lib/logger/middleware'
import { authMiddleware } from './lib/auth'

const serverLogger = logger.child('server')
const migrationLogger = logger.child('migrations')

// Run migrations on startup if enabled
async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== 'true') {
    migrationLogger.debug('Skipped (RUN_MIGRATIONS != true)')
    return
  }

  const { drizzle } = await import('drizzle-orm/postgres-js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')
  const postgres = (await import('postgres')).default

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for migrations')
  }

  migrationLogger.info('Starting database migrations...')
  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    migrationLogger.info('Completed successfully')
  } catch (error) {
    migrationLogger.error('Failed', error instanceof Error ? error : undefined)
    throw error
  } finally {
    await migrationClient.end()
  }
}

// Initialize app
const app = new Hono()

// Sentry error handler middleware - captures errors and re-throws them
app.onError((err) => {
  Sentry.captureException(err)
  throw err
})

// CORS configuration - Chrome extension only in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || []
const isDev = process.env.NODE_ENV !== 'production'

app.use(
  '/*',
  cors({
    origin: (origin) => {
      // Allow Chrome extension origins (chrome-extension://xxx)
      if (origin?.startsWith('chrome-extension://')) {
        // In production, validate against configured extension IDs
        if (!isDev && allowedOrigins.length > 0) {
          return allowedOrigins.includes(origin) ? origin : null
        }
        // In dev or if no specific IDs configured, allow any extension
        return origin
      }
      // Allow configured web origins (for development)
      if (allowedOrigins.includes(origin || '')) return origin
      // Allow localhost in development
      if (isDev && origin?.includes('localhost')) return origin
      return null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS']
  })
)

// Auth middleware - extracts userId and stores in Hono context
// Must run before request logger so userId is available for logging
app.use('/*', authMiddleware())

// Request logging middleware (skip health checks to reduce noise)
app.use('/*', requestLogger({ skip: ['/health'] }))

// Health check endpoint (for container health checks)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'dev'
  })
})

// Debug endpoints to verify Sentry integration (only in development)
if (process.env.NODE_ENV !== 'production') {
  // Test error capture
  app.get('/debug-sentry', () => {
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint'
    })
    throw new Error('My first Sentry error!')
  })

  // Test all log levels - doesn't throw, just logs
  app.get('/debug-sentry-logs', (c) => {
    const testId = crypto.randomUUID().slice(0, 8)

    Sentry.logger.trace('Trace level log', { testId, level: 'trace' })
    Sentry.logger.debug('Debug level log', { testId, level: 'debug' })
    Sentry.logger.info('Info level log', { testId, level: 'info' })
    Sentry.logger.warn('Warning level log', { testId, level: 'warn' })
    Sentry.logger.error('Error level log', { testId, level: 'error' })
    Sentry.logger.fatal('Fatal level log', { testId, level: 'fatal' })

    return c.json({
      success: true,
      message: 'Sent 6 test logs to Sentry (trace, debug, info, warn, error, fatal)',
      testId,
      checkSentryDashboard: 'https://sentry.io → Logs'
    })
  })
}

// Readiness check endpoint (includes DB connectivity)
app.get('/ready', async (c) => {
  try {
    const { db } = await import('./db/client')
    // Simple query to check DB connection
    await db.execute('SELECT 1')
    return c.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    serverLogger.error('Readiness check failed', error instanceof Error ? error : undefined)
    return c.json(
      {
        status: 'not_ready',
        database: 'disconnected',
        error: message,
        timestamp: new Date().toISOString()
      },
      503
    )
  }
})

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext
  })
)

// Run migrations before starting server
await runMigrations()
const port = process.env.PORT || 3000
serverLogger.info('Starting server', {
  port,
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'default'
})

export default {
  port,
  fetch: app.fetch
}

export type { AppRouter } from './routers'
