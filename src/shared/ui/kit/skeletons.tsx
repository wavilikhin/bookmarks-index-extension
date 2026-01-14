import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

/**
 * SpaceItemSkeleton - Matches SpaceItem dimensions exactly
 * Real component: h-10, icon span with size-10, text text-sm font-medium
 */
interface SpaceItemSkeletonProps {
  isCollapsed?: boolean
}

export function SpaceItemSkeleton({ isCollapsed = false }: SpaceItemSkeletonProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-lg transition-all duration-300',
        isCollapsed ? 'justify-center px-1' : 'gap-3 px-3'
      )}
    >
      {/* Emoji icon placeholder - matches size-10 flex container */}
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Skeleton className="size-6 rounded" />
      </div>

      {/* Text placeholder - CSS hidden when collapsed */}
      <Skeleton
        className={cn('h-4 rounded transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'w-24 opacity-100')}
      />
    </div>
  )
}

/**
 * SpaceSkeletonList - Multiple space skeletons
 */
interface SpaceSkeletonListProps {
  count?: number
  isCollapsed?: boolean
}

export function SpaceSkeletonList({ count = 5, isCollapsed = false }: SpaceSkeletonListProps) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <SpaceItemSkeleton key={i} isCollapsed={isCollapsed} />
      ))}
    </div>
  )
}

/**
 * GroupTabSkeleton - Matches GroupTab dimensions exactly
 * Real component: px-3 py-3, GripVertical + text text-sm + menu button
 */
export function GroupTabSkeleton() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 px-3 py-3">
      {/* Grip handle placeholder */}
      <Skeleton className="size-3 rounded" />
      {/* Tab name */}
      <Skeleton className="h-4 w-14 rounded" />
    </div>
  )
}

/**
 * GroupTabSkeletonList - Multiple group tab skeletons with add button
 */
interface GroupTabSkeletonListProps {
  count?: number
}

export function GroupTabSkeletonList({ count = 2 }: GroupTabSkeletonListProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <GroupTabSkeleton key={i} />
      ))}
      {/* Add button placeholder */}
      <div className="ml-1 flex size-8 shrink-0 items-center justify-center">
        <Skeleton className="size-4 rounded" />
      </div>
    </div>
  )
}

/**
 * BookmarkItemSkeleton - Matches BookmarkItem exactly
 * Real component: w-24, p-3, circle size-14, text text-xs
 */
export function BookmarkItemSkeleton() {
  return (
    <div className="flex w-24 flex-col items-center gap-2 rounded-lg p-3">
      {/* Favicon circle - matches size-14 with ring */}
      <Skeleton className="size-14 rounded-full" />
      {/* Title */}
      <Skeleton className="h-3 w-14 rounded" />
    </div>
  )
}

/**
 * BookmarkSkeletonGrid - Matches BookmarkGrid layout exactly
 * Real component: centered grid with responsive columns
 */
interface BookmarkSkeletonGridProps {
  count?: number
}

export function BookmarkSkeletonGrid({ count = 3 }: BookmarkSkeletonGridProps) {
  return (
    <div className="flex w-full flex-col items-center pt-[25vh]">
      {/* Group tabs skeleton - matches GroupTabs width */}
      <div
        className={cn(
          'mb-4 flex items-center justify-between',
          'w-[304px] sm:w-[408px] md:w-[512px] lg:w-[616px] xl:w-[824px]'
        )}
      >
        <GroupTabSkeletonList count={2} />
      </div>
      {/* Bookmark grid skeleton */}
      <div className={cn('grid gap-2', 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8')}>
        {Array.from({ length: count }).map((_, i) => (
          <BookmarkItemSkeleton key={i} />
        ))}
        {/* Add button placeholder */}
        <div className="flex w-24 flex-col items-center gap-2 rounded-lg p-3">
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-muted" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * UserMenuSkeleton - Matches UserMenu exactly
 * Real component: theme button size-9 + UserButton size-9
 */
export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2">
      {/* Theme button */}
      <Skeleton className="size-9 rounded-full" />
      {/* User avatar */}
      <Skeleton className="size-9 rounded-full" />
    </div>
  )
}

/**
 * SidebarButtonSkeleton - Matches bottom control buttons exactly
 * Real component: h-10, icon size-5, text
 */
interface SidebarButtonSkeletonProps {
  isCollapsed?: boolean
}

export function SidebarButtonSkeleton({ isCollapsed = false }: SidebarButtonSkeletonProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-lg transition-all duration-300',
        isCollapsed ? 'justify-center px-1' : 'gap-3 px-3'
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Skeleton className="size-5 rounded" />
      </div>
      <Skeleton
        className={cn('h-3.5 rounded transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'w-16 opacity-100')}
      />
    </div>
  )
}

/**
 * SidebarLogoSkeleton - Matches the logo/brand area exactly
 * Real component: h-10, icon size-10 with bg, text "Bookmarks"
 */
interface SidebarLogoSkeletonProps {
  isCollapsed?: boolean
}

export function SidebarLogoSkeleton({ isCollapsed = false }: SidebarLogoSkeletonProps) {
  return (
    <div className="flex h-10 items-center px-3 overflow-hidden">
      {/* Logo icon container */}
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      {/* "Bookmarks" text */}
      <Skeleton
        className={cn(
          'h-4 w-20 rounded transition-all duration-300',
          isCollapsed ? 'ml-0 opacity-0' : 'ml-3 opacity-100'
        )}
      />
    </div>
  )
}
