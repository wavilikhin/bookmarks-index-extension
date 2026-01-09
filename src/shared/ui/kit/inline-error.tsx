import { AlertCircle, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './button'

interface InlineErrorProps {
  message: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/**
 * InlineError - Compact error display for embedding in content areas
 */
export function InlineError({ message, onRetry, retrying, className }: InlineErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-4', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="size-4 text-destructive/60" />
        <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} disabled={retrying} className="gap-2">
          <RefreshCw className={cn('size-3', retrying && 'animate-spin')} />
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  )
}
