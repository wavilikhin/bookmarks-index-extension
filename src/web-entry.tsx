import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'

import App from './app/App'

import './style.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local')
}

const REDIRECT_URL = window.location.origin

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={REDIRECT_URL}
      signInFallbackRedirectUrl={REDIRECT_URL}
      signUpFallbackRedirectUrl={REDIRECT_URL}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
)
