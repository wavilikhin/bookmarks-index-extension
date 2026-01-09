import * as React from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/shared/ui'
import { InlineEditRow } from './inline-edit-row'
import type { Space } from '@/types'
import type { Atom } from '@reatom/core'
import type { DraftSpace } from '@/stores'

interface SpacesSidebarProps {
  spaces: Atom<Space>[]
  draftSpace: DraftSpace | null
  activeSpaceId: string | null
  isCollapsed: boolean
  editingSpaceId: string | null
  onSelectSpace: (spaceId: string) => void
  onAddSpace: () => void
  onEditSpace: (space: Space) => void
  onDeleteSpace: (space: Space) => void
  onToggleCollapse: () => void
  onSpaceSave: (spaceId: string, name: string, icon: string) => void
  onSpaceCancel: (spaceId: string) => void
}

/**
 * SpacesSidebar - Left vertical navigation for spaces
 *
 * Design: Floating pill active state with subtle shadow depth.
 * The sidebar uses a narrow width to maximize main content area,
 * with icons + text that truncate elegantly. Supports collapse animation.
 */
export function SpacesSidebar({
  spaces,
  draftSpace,
  activeSpaceId,
  isCollapsed,
  editingSpaceId,
  onSelectSpace,
  onAddSpace,
  onEditSpace,
  onDeleteSpace,
  onToggleCollapse,
  onSpaceSave,
  onSpaceCancel
}: SpacesSidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-sidebar py-6 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo / Brand area */}
      <div
        className={cn(
          'mb-6 flex h-10 items-center transition-all duration-200',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <span
          className={cn(
            'text-sm font-semibold text-foreground transition-all duration-200',
            isCollapsed ? 'w-0 opacity-0' : 'opacity-100'
          )}
        >
          Bookmarks
        </span>
      </div>

      {/* Spaces list */}
      <nav className={cn('flex flex-1 flex-col gap-1', isCollapsed ? 'px-0' : 'px-3')}>
        {spaces.map((spaceAtom) => {
          const space = spaceAtom()
          return (
            <SpaceItem
              key={space.id}
              space={space}
              isActive={space.id === activeSpaceId}
              isCollapsed={isCollapsed}
              isEditing={space.id === editingSpaceId}
              isDraft={false}
              onSelect={() => onSelectSpace(space.id)}
              onEdit={() => onEditSpace(space)}
              onDelete={() => onDeleteSpace(space)}
              onSave={(name, icon) => onSpaceSave(space.id, name, icon)}
              onCancel={() => onSpaceCancel(space.id)}
            />
          )
        })}
        {/* Draft space - rendered at the end when creating */}
        {draftSpace && (
          <SpaceItem
            key={draftSpace.id}
            space={draftSpace as Space}
            isActive={draftSpace.id === activeSpaceId}
            isCollapsed={isCollapsed}
            isEditing={draftSpace.id === editingSpaceId}
            isDraft={true}
            onSelect={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onSave={(name, icon) => onSpaceSave(draftSpace.id, name, icon)}
            onCancel={() => onSpaceCancel(draftSpace.id)}
          />
        )}
      </nav>

      {/* Bottom controls */}
      <div className={cn('mt-auto flex flex-col gap-1', isCollapsed ? 'px-0' : 'px-3')}>
        {/* Add space button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSpace}
          className={cn(
            'h-10 w-full text-muted-foreground hover:text-foreground',
            isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
          )}
        >
          <Plus className="size-5 shrink-0" />
          <span className={cn('transition-all duration-200', isCollapsed ? 'w-0 opacity-0' : 'opacity-100')}>
            Add Space
          </span>
        </Button>

        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'h-10 w-full text-muted-foreground hover:text-foreground',
            isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
          )}
        >
          {isCollapsed ? <PanelLeft className="size-5 shrink-0" /> : <PanelLeftClose className="size-5 shrink-0" />}
          <span className={cn('transition-all duration-200', isCollapsed ? 'w-0 opacity-0' : 'opacity-100')}>
            Collapse
          </span>
        </Button>
      </div>
    </aside>
  )
}

interface SpaceItemProps {
  space: Space
  isActive: boolean
  isCollapsed: boolean
  isEditing: boolean
  isDraft: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: (name: string, icon: string) => void
  onCancel: () => void
}

function SpaceItem({
  space,
  isActive,
  isCollapsed,
  isEditing,
  isDraft,
  onSelect,
  onEdit,
  onDelete,
  onSave,
  onCancel
}: SpaceItemProps) {
  const [showMenu, setShowMenu] = React.useState(false)

  const handleDoubleClick = () => {
    if (!isDraft && !isEditing) {
      onEdit()
    }
  }

  return (
    <div
      className={cn(
        'group relative flex h-10 items-center rounded-lg transition-all duration-200',
        'cursor-pointer select-none',
        isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
        isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={isEditing ? undefined : onSelect}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={isEditing ? -1 : 0}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          onSelect()
        }
      }}
    >
      {/* When editing, show InlineEditRow with icon picker + name input */}
      {isEditing ? (
        <InlineEditRow
          defaultName={space.name}
          defaultIcon={space.icon}
          onSave={({ name, icon }) => onSave(name, icon)}
          onCancel={onCancel}
          showIcon={!isCollapsed}
          className={cn('flex-1', isCollapsed ? 'w-0 opacity-0' : 'opacity-100')}
        />
      ) : (
        <>
          {/* Space icon - 40x40 to match sidebar width when collapsed */}
          <span className="flex size-10 shrink-0 items-center justify-center text-xl">{space.icon}</span>

          {/* Space name - hidden when collapsed */}
          <span
            className={cn(
              'flex-1 truncate text-sm font-medium transition-all duration-200',
              isCollapsed ? 'w-0 opacity-0' : 'opacity-100'
            )}
          >
            {space.name}
          </span>
        </>
      )}

      {/* Context menu trigger - hidden when collapsed, editing, or draft */}
      {!isCollapsed && !isEditing && !isDraft && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  'flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity',
                  'hover:bg-foreground/10 focus:opacity-100 group-hover:opacity-100',
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
      )}

      {/* Active indicator pill */}
      {isActive && <div className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />}
    </div>
  )
}

export type { SpacesSidebarProps }
