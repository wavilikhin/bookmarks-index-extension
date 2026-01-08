import * as React from 'react'
import { SignedIn, SignedOut } from '@clerk/chrome-extension'
import { ClerkUserSync } from './clerk-user-sync'
import { AuthScreen } from '@/screens'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Protects routes with Clerk authentication
 *
 * Shows sign-in/sign-up buttons when not authenticated.
 * When authenticated, syncs Clerk user to Reatom and renders children.
 */
export function AuthGuard({ children }: AuthGuardProps) {
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
