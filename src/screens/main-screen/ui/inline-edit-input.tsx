import * as React from 'react'
import { cn } from '@/lib/utils'

interface InlineEditInputProps {
  defaultValue: string
  onSave: (value: string) => void
  onCancel: () => void
  className?: string
}

/**
 * InlineEditInput - Auto-focused input for inline name editing
 *
 * Features:
 * - Auto-focus and select all text on mount
 * - Enter key saves and exits
 * - Escape key cancels (triggers delete in creation flow)
 * - Blur saves the value
 * - Click propagation stopped to prevent parent handlers
 */
export function InlineEditInput({ defaultValue, onSave, onCancel, className }: InlineEditInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [value, setValue] = React.useState(defaultValue)
  const hasBlurredRef = React.useRef(false)

  React.useEffect(() => {
    // Auto-focus and select all text on mount
    const input = inputRef.current
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const handleSave = () => {
    if (hasBlurredRef.current) return
    hasBlurredRef.current = true
    onSave(value)
  }

  const handleCancel = () => {
    if (hasBlurredRef.current) return
    hasBlurredRef.current = true
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'w-full bg-transparent text-sm font-medium outline-none',
        'border-b border-primary focus:border-primary',
        className
      )}
    />
  )
}

export type { InlineEditInputProps }
