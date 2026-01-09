import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8'
}

/**
 * Spinner - Minimal centered spinner for content areas
 */
export function Spinner({ size = 'md', message, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size])} />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
