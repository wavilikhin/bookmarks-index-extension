import * as React from 'react'

interface MainLayoutProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
}

/**
 * MainLayout - Main application layout with slots
 *
 * Structure:
 * - Left sidebar: Spaces navigation
 * - Top header: Group tabs + User menu
 * - Center: Main content area
 */
export function MainLayout({ sidebar, header, children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left sidebar */}
      {sidebar}

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end bg-background">{header}</header>

        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-auto">{children}</div>
      </main>
    </div>
  )
}
