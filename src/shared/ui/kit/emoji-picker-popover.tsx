import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { EmojiPicker } from 'frimousse'
import { cn } from '@/lib/utils'

interface EmojiPickerPopoverProps {
  value: string
  onChange: (emoji: string) => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * EmojiPickerPopover - A popover with an emoji picker using frimousse
 *
 * Features:
 * - Displays current emoji as trigger button
 * - Opens popover with searchable emoji grid
 * - Auto-closes after selection
 * - Keyboard accessible
 */
export function EmojiPickerPopover({ value, onChange, onOpenChange, disabled, className }: EmojiPickerPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    onChange(emojiData.emoji)
    handleOpenChange(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md text-xl',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50',
          'transition-colors cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup
            className={cn(
              'z-50 rounded-lg border border-border bg-popover shadow-lg',
              'data-open:animate-in data-closed:animate-out',
              'data-closed:fade-out-0 data-open:fade-in-0',
              'data-closed:zoom-out-95 data-open:zoom-in-95'
            )}
          >
            <EmojiPicker.Root onEmojiSelect={handleEmojiSelect} className="flex h-80 w-fit flex-col">
              <EmojiPicker.Search
                className={cn(
                  'm-2 rounded-md border border-border bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
                placeholder="Search emoji..."
              />
              <EmojiPicker.Viewport className="flex-1 overflow-y-auto px-2 pb-2">
                <EmojiPicker.Loading className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading...
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No emoji found
                </EmojiPicker.Empty>
                <EmojiPicker.List
                  className="select-none"
                  components={{
                    CategoryHeader: ({ category }) => (
                      <div className="sticky top-0 bg-popover py-2 text-xs font-medium text-muted-foreground">
                        {category.label}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }) => (
                      <button
                        type="button"
                        className={cn(
                          'flex size-8 items-center justify-center rounded text-lg',
                          'hover:bg-muted focus:bg-muted focus:outline-none',
                          'transition-colors cursor-pointer'
                        )}
                        {...props}
                      >
                        {emoji.emoji}
                      </button>
                    )
                  }}
                />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export type { EmojiPickerPopoverProps }
