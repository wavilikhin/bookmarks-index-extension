import { Button } from '@/shared/ui'
import { SignInButton, SignUpButton } from '@clerk/chrome-extension'
import { Bookmark } from 'lucide-react'

export const AuthScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bookmark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bookmarks Index</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organize your bookmarks with spaces and groups</p>
          </div>
        </div>

        {/* Auth buttons */}
        <div className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <Button className="w-full">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" className="w-full">
              Create account
            </Button>
          </SignUpButton>
        </div>

        <p className="text-center text-xs text-muted-foreground">Your bookmarks are stored securely in your browser.</p>
      </div>
    </div>
  )
}
