import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/chrome-extension'

import './index.css'
import App from './app/App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const EXTENSION_URL = chrome.runtime.getURL('.')

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local')
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignOutUrl={EXTENSION_URL}
    signInFallbackRedirectUrl={EXTENSION_URL}
    signUpFallbackRedirectUrl={EXTENSION_URL}
  >
    <App />
  </ClerkProvider>
)
