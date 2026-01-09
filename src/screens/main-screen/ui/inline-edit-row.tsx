import * as React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmojiPickerPopover } from '@/shared/ui'
import { InlineEditInput } from './inline-edit-input'

interface InlineEditRowProps {
  defaultName: string
  defaultIcon: string
  onSave: (data: { name: string; icon: string }) => void
  onCancel: () => void
  showIcon?: boolean
  className?: string
}

/**
 * InlineEditRow - Combined icon picker + name input for inline editing
 *
 * Features:
 * - Clickable emoji opens picker popover
 * - Name input with auto-focus and keyboard support
 * - Check/Cross buttons for explicit save/cancel
 * - Enter key saves, Escape key cancels
 * - Does NOT exit on blur or outside clicks
 */
export function InlineEditRow({
  defaultName,
  defaultIcon,
  onSave,
  onCancel,
  showIcon = true,
  className
}: InlineEditRowProps) {
  const [name, setName] = React.useState(defaultName)
  const [icon, setIcon] = React.useState(defaultIcon)
  const hasSavedRef = React.useRef(false)

  // Reset state when component mounts (entering edit mode)
  React.useEffect(() => {
    setName(defaultName)
    setIcon(defaultIcon)
    hasSavedRef.current = false
  }, [defaultName, defaultIcon])

  const handleSave = () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    onSave({ name, icon })
  }

  const handleCancel = () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    onCancel()
  }

  return (
    <div className={cn('relative flex items-center gap-1', className)}>
      {showIcon && <EmojiPickerPopover value={icon} onChange={setIcon} className="size-10" />}
      <InlineEditInput value={name} onChange={setName} onSave={handleSave} onCancel={handleCancel} className="flex-1" />
      {/* Action buttons - positioned below on the right, high z-index to stay on top */}
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
            'flex size-6 items-center justify-center rounded-md',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'transition-colors cursor-pointer shadow-md'
          )}
          title="Save (Enter)"
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCancel()
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded-md',
            'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground',
            'transition-colors cursor-pointer shadow-md'
          )}
          title="Cancel (Escape)"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export type { InlineEditRowProps }
