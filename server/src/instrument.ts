import * as Sentry from '@sentry/bun'

// Only initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || undefined,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
    // Send structured logs to Sentry
    _experiments: {
      enableLogs: true
    }
  })
} else if (process.env.NODE_ENV === 'production') {
  console.warn('[sentry] SENTRY_DSN not configured - error tracking disabled')
}
