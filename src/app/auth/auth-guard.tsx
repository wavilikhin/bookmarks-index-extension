import * as React from 'react'
import { useAuth } from '@clerk/chrome-extension'
import { SignedIn, SignedOut } from '@clerk/chrome-extension'
import { ClerkUserSync } from './clerk-user-sync'
import { AppShellLoading } from './app-shell-loading'
import { AuthScreen } from '@/screens'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Protects routes with Clerk authentication
 *
 * Shows:
 * - App shell loading state while Clerk initializes
 * - Sign-in/sign-up buttons when not authenticated
 * - Main app content when authenticated (after syncing user to Reatom)
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded } = useAuth()

  // Show app shell while Clerk initializes
  if (!isLoaded) {
    return <AppShellLoading />
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
