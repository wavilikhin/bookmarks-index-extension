import { Spinner } from '@/shared/ui'

/**
 * AppShellLoading - Static shell matching final layout structure
 *
 * Displayed while Clerk authentication is initializing.
 * Matches the exact layout dimensions of the real app to prevent layout shifts.
 */
export function AppShellLoading() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar placeholder - exact width as real sidebar (collapsed) */}
      <aside className="flex w-16 flex-col border-r border-border bg-sidebar">
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="sm" />
        </div>
      </aside>

      {/* Main area */}
      <main className="flex flex-1 flex-col">
        {/* Header placeholder */}
        <header className="flex h-12 items-center border-b border-border bg-background" />

        {/* Content placeholder */}
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" message="Loading..." />
        </div>
      </main>
    </div>
  )
}
