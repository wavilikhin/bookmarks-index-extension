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
    <div className={cn('flex items-center gap-1', className)}>
      {showIcon && <EmojiPickerPopover value={icon} onChange={setIcon} className="size-10" />}
      <InlineEditInput value={name} onChange={setName} onSave={handleSave} onCancel={handleCancel} className="flex-1" />
      {/* Action buttons - inline on the right, subtle styling */}
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
            'flex size-5 items-center justify-center rounded',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            'transition-colors cursor-pointer'
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
