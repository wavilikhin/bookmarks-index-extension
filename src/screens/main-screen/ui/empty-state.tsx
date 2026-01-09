import { Layers, FolderOpen, Bookmark, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/ui'

type EmptyStateType = 'welcome' | 'no-spaces' | 'no-groups' | 'no-bookmarks'

interface EmptyStateProps {
  type: EmptyStateType
  onAction: () => void
}

const emptyStateConfig = {
  welcome: {
    icon: Sparkles,
    title: 'Welcome to Bookmarks',
    description: 'Organize your bookmarks into spaces and groups. Create your first space to get started.',
    action: 'Create your first space'
  },
  'no-spaces': {
    icon: Layers,
    title: 'No spaces yet',
    description: 'Spaces help you organize bookmarks by context—like Work, Personal, or Learning.',
    action: 'Add a space'
  },
  'no-groups': {
    icon: FolderOpen,
    title: 'No groups in this space',
    description: 'Groups let you categorize bookmarks within a space—like Development, Design, or Docs.',
    action: 'Add a group'
  },
  'no-bookmarks': {
    icon: Bookmark,
    title: 'No bookmarks yet',
    description: 'Add your favorite sites to this group for quick access.',
    action: 'Add a bookmark'
  }
}

/**
 * EmptyState - Contextual empty state messages
 *
 * Design: Centered, minimal illustration with clear call-to-action.
 * Uses muted colors to feel gentle rather than error-like.
 * Subtle dashed border container for visual distinction.
 */
export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center px-4 py-8">
      {/* Subtle container with dashed border */}
      <div
        className={cn(
          'flex flex-col items-center rounded-2xl px-16 py-9',
          'bg-muted/30 border border-dashed border-border/40',
          'backdrop-blur-[1px]'
        )}
      >
        <div
          className={cn(
            'mb-6 flex size-16 items-center justify-center rounded-2xl',
            'bg-background/80 ring-1 ring-border/50 shadow-sm'
          )}
        >
          <Icon className="size-7 text-muted-foreground" />
        </div>

        <h2 className="mb-2 text-center text-base font-medium text-foreground">{config.title}</h2>

        <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">{config.description}</p>

        <Button onClick={onAction} className="gap-2">
          <Plus className="size-4" />
          {config.action}
        </Button>
      </div>
    </div>
  )
}

export type { EmptyStateProps, EmptyStateType }
