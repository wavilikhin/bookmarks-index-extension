import * as React from 'react'
import { reatomComponent } from '@reatom/react'
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
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
import { loadGroups } from '@/domain/groups'
import { InlineEditInput } from './inline-edit-input'
import { InlineError } from '@/shared/ui'
import type { Group } from '@/types'
import type { Atom } from '@reatom/core'
import type { DraftGroup } from '@/stores'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface GroupTabsProps {
  groups: Atom<Group>[]
  draftGroup: DraftGroup | null
  activeGroupId: string | null
  editingGroupId: string | null
  spaceId: string | null
  onSelectGroup: (groupId: string) => void
  onAddGroup: () => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (group: Group) => void
  onGroupNameSave: (groupId: string, name: string) => void
  onGroupNameCancel: (groupId: string) => void
  onReorderGroups: (spaceId: string, orderedIds: string[]) => void
  className?: string
}

/**
 * GroupTabs - Horizontal tab navigation for groups within a space
 *
 * Design: Underline-style tabs with smooth transitions.
 * Active tab has a subtle bottom border and slightly elevated typography.
 */
export const GroupTabs = reatomComponent<GroupTabsProps>(
  ({
    groups,
    draftGroup,
    activeGroupId,
    editingGroupId,
    spaceId,
    onSelectGroup,
    onAddGroup,
    onEditGroup,
    onDeleteGroup,
    onGroupNameSave,
    onGroupNameCancel,
    onReorderGroups,
    className
  }) => {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8
        }
      })
    )

    const groupIds = React.useMemo(() => groups.map((g) => g().id), [groups])
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const activeGroup = React.useMemo(() => {
      if (!activeId) return null
      const groupAtom = groups.find((g) => g().id === activeId)
      return groupAtom ? groupAtom() : null
    }, [activeId, groups])

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (over && active.id !== over.id && spaceId) {
        const oldIndex = groupIds.findIndex((id) => id === active.id)
        const newIndex = groupIds.findIndex((id) => id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(groupIds, oldIndex, newIndex)
          onReorderGroups(spaceId, newOrder)
        }
      }
    }

    const handleDragCancel = () => {
      setActiveId(null)
    }

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

    const loading = loadGroups.pending() > 0
    const error = loadGroups.error()?.message || null

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={groupIds} strategy={horizontalListSortingStrategy}>
              {groups.map((groupAtom) => {
                const group = groupAtom()
                return (
                  <SortableGroupTab
                    key={group.id}
                    id={group.id}
                    group={group}
                    isActive={group.id === activeGroupId}
                    isEditing={group.id === editingGroupId}
                    onSelect={() => onSelectGroup(group.id)}
                    onEdit={() => onEditGroup(group)}
                    onDelete={() => onDeleteGroup(group)}
                    onSave={(name) => onGroupNameSave(group.id, name)}
                    onCancel={() => onGroupNameCancel(group.id)}
                  />
                )
              })}
            </SortableContext>
            <DragOverlay>
              {activeGroup ? (
                <GroupTab
                  group={activeGroup}
                  isActive={activeGroup.id === activeGroupId}
                  isEditing={false}
                  isDragging={true}
                  onSelect={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
          {/* Draft group - rendered at the end when creating (not draggable) */}
          {draftGroup && (
            <GroupTab
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
  },
  'GroupTabs'
)

interface GroupTabProps {
  group: Group
  isActive: boolean
  isEditing: boolean
  isDraft?: boolean
  isDragging?: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: (name: string) => void
  onCancel: () => void
}

interface SortableGroupTabProps extends Omit<GroupTabProps, 'isDraft' | 'isDragging'> {
  id: string
}

function SortableGroupTab({
  id,
  group,
  isActive,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
  onSave,
  onCancel
}: SortableGroupTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isEditing
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    // Use fast transition only when not dragging for snappy reordering
    transition: isDragging ? undefined : transition,
    // Dim original when dragging (DragOverlay shows the clone)
    opacity: isDragging ? 0.4 : undefined,
    touchAction: 'none'
  }

  return (
    <GroupTab
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      group={group}
      isActive={isActive}
      isEditing={isEditing}
      isDragging={isDragging}
      onSelect={onSelect}
      onEdit={onEdit}
      onDelete={onDelete}
      onSave={onSave}
      onCancel={onCancel}
    />
  )
}

const GroupTab = React.forwardRef<
  HTMLDivElement,
  GroupTabProps & React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }
>(function GroupTab(
  {
    group,
    isActive,
    isEditing,
    isDraft,
    isDragging,
    onSelect,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    style,
    className,
    ...dragProps
  },
  ref
) {
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
      ref={ref}
      style={style}
      {...(isDraft || isEditing ? {} : dragProps)}
      className={cn(
        'group relative flex shrink-0 items-center gap-1.5 px-3 py-3',
        isDragging
          ? 'shadow-lg !cursor-grabbing bg-muted rounded-lg border border-border'
          : 'cursor-grab select-none transition-colors duration-150 active:cursor-grabbing',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={isEditing || isDragging ? undefined : onSelect}
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
      {/* Group name - editable when isEditing */}
      {isEditing ? (
        <div className="flex items-center gap-1">
          <InlineEditInput
            value={name}
            onChange={setName}
            onSave={handleSave}
            onCancel={handleCancel}
            className="min-w-20 text-foreground"
          />
          {/* Action buttons - inline, subtle styling */}
          <div
            className="flex shrink-0 items-center gap-0.5"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
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
                'text-muted-foreground hover:text-primary hover:bg-primary/10',
                'transition-colors cursor-pointer'
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
                'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                'transition-colors cursor-pointer'
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
                onPointerDown={(e) => e.stopPropagation()}
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
})

export type { GroupTabsProps }
