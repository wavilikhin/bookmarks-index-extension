import * as React from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ContentState,
  SpaceSkeletonList
} from '@/shared/ui'
import { spacesLoadingAtom, spacesErrorAtom, loadSpaces } from '@/domain/spaces'
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
      <div className="mb-6 flex h-10 items-center px-3 overflow-hidden">
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
            'whitespace-nowrap text-sm font-semibold text-foreground transition-all duration-300',
            isCollapsed ? 'ml-0 opacity-0' : 'ml-3 opacity-100'
          )}
        >
          Bookmarks
        </span>
      </div>

      {/* Spaces list - centered vertically */}
      <nav
        className={cn(
          'flex flex-1 flex-col justify-center gap-1 overflow-y-auto transition-all duration-300',
          isCollapsed ? 'px-2' : 'px-3'
        )}
      >
        <ContentState
          loading={spacesLoadingAtom()}
          error={spacesErrorAtom()}
          onRetry={() => loadSpaces()}
          skeleton={<SpaceSkeletonList count={3} isCollapsed={isCollapsed} />}
        >
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
        </ContentState>
      </nav>

      {/* Bottom controls */}
      <div className={cn('mt-auto flex flex-col gap-1 transition-all duration-300', isCollapsed ? 'px-2' : 'px-3')}>
        {/* Add space button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSpace}
          className={cn(
            'h-10 w-full text-muted-foreground hover:text-foreground transition-all duration-300',
            isCollapsed ? 'justify-center px-1' : 'justify-start gap-3 px-3'
          )}
        >
          <Plus className="size-5 shrink-0" />
          <span className={cn('transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'opacity-100')}>
            Add Space
          </span>
        </Button>

        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'h-10 w-full text-muted-foreground hover:text-foreground transition-all duration-300',
            isCollapsed ? 'justify-center px-1' : 'justify-start gap-3 px-3'
          )}
        >
          {isCollapsed ? <PanelLeft className="size-5 shrink-0" /> : <PanelLeftClose className="size-5 shrink-0" />}
          <span className={cn('transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'opacity-100')}>
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
        'group relative flex h-10 items-center rounded-lg transition-all duration-300',
        'cursor-pointer select-none',
        isCollapsed ? 'justify-center px-1' : 'gap-3 px-3',
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
          {/* Space icon - 40x40 with subtle background for emoji visibility */}
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg text-xl',
              'bg-foreground/[0.04] dark:bg-transparent'
            )}
          >
            {space.icon}
          </span>

          {/* Space name - hidden when collapsed */}
          <span
            className={cn(
              'flex-1 truncate text-sm font-medium transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'opacity-100'
            )}
          >
            {space.name}
          </span>
        </>
      )}

      {/* Context menu trigger - hidden when collapsed, editing, or draft */}
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isCollapsed || isEditing || isDraft ? 'w-0 opacity-0' : 'w-6 opacity-100'
        )}
      >
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
                disabled={isCollapsed || isEditing || isDraft}
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
      </div>

      {/* Active indicator pill */}
      {isActive && (
        <div
          className={cn(
            'absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-300',
            isCollapsed ? '-left-1' : '-left-3'
          )}
        />
      )}
    </div>
  )
}

export type { SpacesSidebarProps }
