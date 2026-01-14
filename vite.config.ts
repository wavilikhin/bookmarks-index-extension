import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './src'),
        // Map chrome-extension Clerk package to standard React package for web mode
        '@clerk/chrome-extension': '@clerk/clerk-react'
      }
    },
    define: {
      // Map Plasmo env vars to Vite env vars for compatibility
      'process.env.PLASMO_PUBLIC_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000/trpc'),
      'process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY || ''),
      'process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST': JSON.stringify(env.VITE_CLERK_SYNC_HOST || '')
    },
    publicDir: 'assets',
    server: {
      port: 5173,
      open: true
    }
  }
})
