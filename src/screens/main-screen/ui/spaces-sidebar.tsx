import * as React from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/shared/ui'
import type { Space } from '@/types'
import type { Atom } from '@reatom/core'

interface SpacesSidebarProps {
  spaces: Atom<Space>[]
  activeSpaceId: string | null
  onSelectSpace: (spaceId: string) => void
  onAddSpace: () => void
  onEditSpace: (space: Space) => void
  onDeleteSpace: (space: Space) => void
}

/**
 * SpacesSidebar - Left vertical navigation for spaces
 *
 * Design: Floating pill active state with subtle shadow depth.
 * The sidebar uses a narrow width to maximize main content area,
 * with icons + text that truncate elegantly.
 */
export function SpacesSidebar({
  spaces,
  activeSpaceId,
  onSelectSpace,
  onAddSpace,
  onEditSpace,
  onDeleteSpace
}: SpacesSidebarProps) {
  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-border/50 bg-sidebar py-6 md:w-56">
      {/* Logo / Brand area */}
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <span className="hidden text-sm font-medium text-foreground md:block">Bookmarks</span>
      </div>

      {/* Spaces list */}
      <nav className="flex flex-1 flex-col gap-1 px-2 md:w-full md:px-3">
        {spaces.map((spaceAtom) => {
          const space = spaceAtom()
          return (
            <SpaceItem
              key={space.id}
              space={space}
              isActive={space.id === activeSpaceId}
              onSelect={() => onSelectSpace(space.id)}
              onEdit={() => onEditSpace(space)}
              onDelete={() => onDeleteSpace(space)}
            />
          )
        })}
      </nav>

      {/* Add space button */}
      <div className="mt-auto px-2 md:w-full md:px-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSpace}
          className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground md:justify-start"
        >
          <Plus className="size-4" />
          <span className="hidden md:inline">Add Space</span>
        </Button>
      </div>
    </aside>
  )
}

interface SpaceItemProps {
  space: Space
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function SpaceItem({ space, isActive, onSelect, onEdit, onDelete }: SpaceItemProps) {
  const [showMenu, setShowMenu] = React.useState(false)

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200',
        'cursor-pointer select-none',
        isActive
          ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect()
        }
      }}
    >
      {/* Space icon */}
      <span className="flex size-8 shrink-0 items-center justify-center text-lg md:size-6 md:text-base">
        {space.icon}
      </span>

      {/* Space name - hidden on mobile */}
      <span className="hidden flex-1 truncate text-sm font-medium md:block">{space.name}</span>

      {/* Context menu trigger */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger
          render={
            <button
              className={cn(
                'hidden size-6 items-center justify-center rounded-md opacity-0 transition-opacity',
                'hover:bg-foreground/10 focus:opacity-100 group-hover:opacity-100',
                'md:flex',
                showMenu && 'opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Pencil className="mr-2 size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active indicator pill */}
      {isActive && (
        <div className="absolute -left-0.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary md:-left-3" />
      )}
    </div>
  )
}

export type { SpacesSidebarProps }
