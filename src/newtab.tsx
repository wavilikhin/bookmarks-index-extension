import { ClerkProvider } from '@clerk/chrome-extension'

import App from './app/App'

import './style.css'

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env')
}

// Chrome Extension URL for navigation redirects (newtab page)
const EXTENSION_URL = chrome.runtime.getURL('.')

function NewTabPage() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={`${EXTENSION_URL}/newtab.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/newtab.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/newtab.html`}
    >
      <App />
    </ClerkProvider>
  )
}

export default NewTabPage
