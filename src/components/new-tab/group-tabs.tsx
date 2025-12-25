import * as React from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Group } from "@/types"

interface GroupTabsProps {
  groups: Group[]
  activeGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onAddGroup: () => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (group: Group) => void
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
  activeGroupId,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
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
      el.addEventListener("scroll", checkOverflow)
      window.addEventListener("resize", checkOverflow)
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkOverflow)
      window.removeEventListener("resize", checkOverflow)
    }
  }, [checkOverflow, groups])

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <span className="text-sm text-muted-foreground">No groups yet</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddGroup}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add Group
        </Button>
      </div>
    )
  }

  return (
    <div className="relative border-b border-border/50">
      {/* Left fade indicator */}
      {showLeftFade && (
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      )}

      {/* Tabs container */}
      <div
        ref={tabsRef}
        className="flex items-center gap-1 overflow-x-auto px-4 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {groups.map((group) => (
          <GroupTab
            key={group.id}
            group={group}
            isActive={group.id === activeGroupId}
            onSelect={() => onSelectGroup(group.id)}
            onEdit={() => onEditGroup(group)}
            onDelete={() => onDeleteGroup(group)}
          />
        ))}

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
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function GroupTab({ group, isActive, onSelect, onEdit, onDelete }: GroupTabProps) {
  const [showMenu, setShowMenu] = React.useState(false)

  return (
    <div
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 px-3 py-3 transition-colors duration-150",
        "cursor-pointer select-none",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onSelect}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect()
        }
      }}
    >
      {/* Drag handle - visible on hover for future drag implementation */}
      <GripVertical
        className={cn(
          "size-3 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity",
          "group-hover:opacity-100"
        )}
      />

      {/* Group name */}
      <span
        className={cn(
          "text-sm transition-all",
          isActive ? "font-medium" : "font-normal"
        )}
      >
        {group.name}
      </span>

      {/* Context menu */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger
          render={
            <button
              className={cn(
                "flex size-5 items-center justify-center rounded opacity-0 transition-opacity",
                "hover:bg-foreground/10 focus:opacity-100 group-hover:opacity-100",
                showMenu && "opacity-100"
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

      {/* Active indicator underline */}
      {isActive && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
      )}
    </div>
  )
}

export type { GroupTabsProps }
