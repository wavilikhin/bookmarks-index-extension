import * as React from 'react'
import { cn } from '@/lib/utils'

interface InlineEditInputProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  className?: string
}

/**
 * InlineEditInput - Auto-focused input for inline name editing
 *
 * Features:
 * - Auto-focus and select all text on mount
 * - Enter key triggers save
 * - Escape key triggers cancel
 * - Click propagation stopped to prevent parent handlers
 * - Controlled component - parent manages state
 */
export function InlineEditInput({ value, onChange, onSave, onCancel, className }: InlineEditInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    // Auto-focus and select all text on mount
    const input = inputRef.current
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
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
