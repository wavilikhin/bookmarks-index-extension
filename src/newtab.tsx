import { ClerkProvider } from '@clerk/clerk-react'

import App from './app/App'

import './style.css'

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env')
}

function NewTabPage() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  )
}

export default NewTabPage
