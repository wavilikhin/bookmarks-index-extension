import * as React from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth-store"
import { usernameSchema } from "@/lib/utils/validators"

/**
 * LoginForm - Username-based authentication for local storage
 *
 * Uses a simple username input that creates or retrieves an existing user.
 * Data is isolated per username in IndexedDB.
 */
export function LoginForm() {
  const [username, setUsername] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate username
    const result = usernameSchema.safeParse(username)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    try {
      await login(username)
    } catch {
      setError("Failed to login. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bookmark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Bookmarks Index
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize your bookmarks with spaces and groups
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
              autoComplete="username"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? "Signing in..." : "Continue"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your data is stored locally in your browser.
            <br />
            Use the same username to access your bookmarks.
          </p>
        </form>
      </div>
    </div>
  )
}
