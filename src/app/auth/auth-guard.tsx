import * as React from 'react'
import { useAuth } from '@clerk/chrome-extension'
import { SignedIn, SignedOut } from '@clerk/chrome-extension'
import { ClerkUserSync } from './clerk-user-sync'
import { GenericLoadingScreen } from '@/shared/ui'
import { AuthScreen } from '@/screens'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Protects routes with Clerk authentication
 *
 * Shows:
 * - Generic loading screen with rotating phrases while Clerk initializes
 * - Sign-in/sign-up buttons when not authenticated
 * - Main app content when authenticated (after syncing user to Reatom)
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded } = useAuth()

  // Show generic loading screen while Clerk initializes
  // (before we know if user is logged in - don't show app-specific UI)
  if (!isLoaded) {
    return <GenericLoadingScreen />
  }

  return (
    <>
      <SignedOut>
        <AuthScreen />
      </SignedOut>

      <SignedIn>
        <ClerkUserSync>{children}</ClerkUserSync>
      </SignedIn>
    </>
  )
}
