import {
  SidebarLogoSkeleton,
  SpaceSkeletonList,
  SidebarButtonSkeleton,
  GroupTabSkeletonList,
  UserMenuSkeleton,
  BookmarkSkeletonGrid
} from '@/shared/ui'

/**
 * AppShellLoading - Full skeleton layout matching MainLayout + components exactly
 *
 * Displayed while Clerk authentication is initializing.
 * Must match MainLayout structure precisely to prevent any layout shifts.
 */
export function AppShellLoading() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar skeleton - matches SpacesSidebar exactly */}
      <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar py-6 transition-all duration-300 ease-in-out">
        {/* Logo / Brand area - matches SpacesSidebar exactly */}
        <div className="mb-6">
          <SidebarLogoSkeleton isCollapsed={false} />
        </div>

        {/* Spaces list */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          <SpaceSkeletonList count={5} isCollapsed={false} />
        </nav>

        {/* Bottom controls */}
        <div className="mt-auto flex flex-col gap-1 px-3">
          <SidebarButtonSkeleton isCollapsed={false} />
          <SidebarButtonSkeleton isCollapsed={false} />
        </div>
      </aside>

      {/* Main content area - matches MainLayout exactly */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar - matches MainLayout header (no border-b, uses justify-between) */}
        <header className="flex items-center justify-between bg-background">
          {/* Group tabs skeleton */}
          <div className="flex-1">
            <GroupTabSkeletonList count={3} />
          </div>

          {/* User menu skeleton */}
          <div className="flex items-center gap-2 px-4 py-2">
            <UserMenuSkeleton />
          </div>
        </header>

        {/* Content area - matches MainLayout children wrapper */}
        <div className="flex flex-1 overflow-auto">
          <BookmarkSkeletonGrid count={6} />
        </div>
      </main>
    </div>
  )
}
