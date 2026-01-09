import * as React from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  GroupTabSkeletonList
} from '@/shared/ui'
import { groupsLoadingAtom, groupsErrorAtom, loadGroups } from '@/domain/groups'
import { InlineEditInput } from './inline-edit-input'
import { InlineError } from '@/shared/ui'
import type { Group } from '@/types'
import type { Atom } from '@reatom/core'
import type { DraftGroup } from '@/stores'

interface GroupTabsProps {
  groups: Atom<Group>[]
  draftGroup: DraftGroup | null
  activeGroupId: string | null
  editingGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onAddGroup: () => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (group: Group) => void
  onGroupNameSave: (groupId: string, name: string) => void
  onGroupNameCancel: (groupId: string) => void
  className?: string
}

/**
 * GroupTabs - Horizontal tab navigation for groups within a space
 *
 * Design: Underline-style tabs with smooth transitions.
 * Active tab has a subtle bottom border and slightly elevated typography.
 * Includes drag handle placeholder for future reordering.
 */
export function GroupTabs({
  groups,
  draftGroup,
  activeGroupId,
  editingGroupId,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onGroupNameSave,
  onGroupNameCancel,
  className
}: GroupTabsProps) {
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = React.useState(false)
  const [showRightFade, setShowRightFade] = React.useState(false)

  // Check for overflow and show fade indicators
  const checkOverflow = React.useCallback(() => {
    if (!tabsRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
    setShowLeftFade(scrollLeft > 0)
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    checkOverflow()
    const el = tabsRef.current
    if (el) {
      el.addEventListener('scroll', checkOverflow)
      window.addEventListener('resize', checkOverflow)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkOverflow)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [checkOverflow, groups, draftGroup])

  const loading = groupsLoadingAtom()
  const error = groupsErrorAtom()

  // Shared width classes to match BookmarkGrid
  const widthClasses = 'w-[304px] sm:w-[408px] md:w-[512px] lg:w-[616px] xl:w-[824px]'

  // Show skeleton loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-between', widthClasses, className)}>
        <GroupTabSkeletonList count={3} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddGroup}
          disabled={true}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add Group
        </Button>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-between py-3', widthClasses, className)}>
        <InlineError message={error} onRetry={() => loadGroups()} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddGroup}
          disabled={true}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add Group
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative',
        // Match BookmarkGrid responsive width: (cols * 96px) + ((cols-1) * 8px gap)
        'w-[304px] sm:w-[408px] md:w-[512px] lg:w-[616px] xl:w-[824px]',
        className
      )}
    >
      {/* Left fade indicator */}
      {showLeftFade && (
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      )}

      {/* Tabs container */}
      <div
        ref={tabsRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {groups.map((groupAtom) => {
          const group = groupAtom()
          return (
            <GroupTab
              key={group.id}
              group={group}
              isActive={group.id === activeGroupId}
              isEditing={group.id === editingGroupId}
              isDraft={false}
              onSelect={() => onSelectGroup(group.id)}
              onEdit={() => onEditGroup(group)}
              onDelete={() => onDeleteGroup(group)}
              onSave={(name) => onGroupNameSave(group.id, name)}
              onCancel={() => onGroupNameCancel(group.id)}
            />
          )
        })}
        {/* Draft group - rendered at the end when creating */}
        {draftGroup && (
          <GroupTab
            key={draftGroup.id}
            group={draftGroup as Group}
            isActive={draftGroup.id === activeGroupId}
            isEditing={draftGroup.id === editingGroupId}
            isDraft={true}
            onSelect={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onSave={(name) => onGroupNameSave(draftGroup.id, name)}
            onCancel={() => onGroupNameCancel(draftGroup.id)}
          />
        )}

        {/* Add group button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onAddGroup}
          className="ml-1 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Right fade indicator */}
      {showRightFade && (
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  )
}

interface GroupTabProps {
  group: Group
  isActive: boolean
  isEditing: boolean
  isDraft: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: (name: string) => void
  onCancel: () => void
}

function GroupTab({
  group,
  isActive,
  isEditing,
  isDraft,
  onSelect,
  onEdit,
  onDelete,
  onSave,
  onCancel
}: GroupTabProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [name, setName] = React.useState(group.name)
  const hasSavedRef = React.useRef(false)

  // Reset state when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setName(group.name)
      hasSavedRef.current = false
    }
  }, [isEditing, group.name])

  const handleDoubleClick = () => {
    if (!isDraft && !isEditing) {
      onEdit()
    }
  }

  const handleSave = () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    onSave(name)
  }

  const handleCancel = () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    onCancel()
  }

  return (
    <div
      className={cn(
        'group relative flex shrink-0 items-center gap-1.5 px-3 py-3 transition-colors duration-150',
        'cursor-pointer select-none',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
      onClick={isEditing ? undefined : onSelect}
      onDoubleClick={handleDoubleClick}
      role="tab"
      tabIndex={isEditing ? -1 : 0}
      aria-selected={isActive}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          onSelect()
        }
      }}
    >
      {/* Drag handle - hidden when editing or draft */}
      {!isEditing && !isDraft && (
        <GripVertical
          className={cn(
            'size-3 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity',
            'group-hover:opacity-100'
          )}
        />
      )}

      {/* Group name - editable when isEditing */}
      {isEditing ? (
        <div className="relative flex items-center">
          <InlineEditInput
            value={name}
            onChange={setName}
            onSave={handleSave}
            onCancel={handleCancel}
            className="min-w-20 text-foreground"
          />
          {/* Action buttons - positioned below, high z-index to stay on top */}
          <div
            className="absolute -bottom-7 right-0 z-50 flex items-center gap-1"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSave()
              }}
              className={cn(
                'flex size-5 items-center justify-center rounded',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'transition-colors cursor-pointer shadow-md'
              )}
              title="Save (Enter)"
            >
              <Check className="size-3" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCancel()
              }}
              className={cn(
                'flex size-5 items-center justify-center rounded',
                'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground',
                'transition-colors cursor-pointer shadow-md'
              )}
              title="Cancel (Escape)"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : (
        <span className={cn('text-sm transition-all', isActive ? 'font-medium' : 'font-normal')}>{group.name}</span>
      )}

      {/* Context menu - hidden when editing or draft */}
      {!isEditing && !isDraft && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  'flex size-5 items-center justify-center rounded opacity-0 transition-opacity',
                  'hover:bg-foreground/10 focus:opacity-100 group-hover:opacity-100',
                  showMenu && 'opacity-100'
                )}
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4}>
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

      {/* Active indicator underline */}
      {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />}
    </div>
  )
}

export type { GroupTabsProps }
