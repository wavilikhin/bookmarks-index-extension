import { ClerkProvider } from '@clerk/chrome-extension'

import App from './app/App'

import './style.css'

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env')
}

// Warn if sync host is not configured (OAuth won't work without it)
if (!SYNC_HOST) {
  console.warn(
    '[Clerk] PLASMO_PUBLIC_CLERK_SYNC_HOST not configured. OAuth providers (GitHub, Google) will not work.'
  )
}

// Chrome Extension URL for navigation redirects (newtab page)
// Use getURL directly with the page name to avoid double-slash issues
const NEW_TAB_URL = `${chrome.runtime.getURL('.')}newtab.html`

function NewTabPage() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      syncHost={SYNC_HOST}
      afterSignOutUrl={NEW_TAB_URL}
      signInFallbackRedirectUrl={NEW_TAB_URL}
      signUpFallbackRedirectUrl={NEW_TAB_URL}
    >
      <App />
    </ClerkProvider>
  )
}

export default NewTabPage
