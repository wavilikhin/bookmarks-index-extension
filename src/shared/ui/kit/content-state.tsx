import * as React from 'react'

import { cn } from '@/lib/utils'
import { Spinner } from './spinner'
import { InlineError } from './inline-error'

interface ContentStateProps {
  loading: boolean
  error: string | null
  onRetry?: () => void
  retrying?: boolean
  loadingMessage?: string
  children: React.ReactNode
  className?: string
}

/**
 * ContentState - Utility component handling loading/error/content states
 *
 * Renders appropriate UI based on current state:
 * - Loading: Shows centered spinner with optional message
 * - Error: Shows inline error with retry button
 * - Content: Renders children
 */
export function ContentState({
  loading,
  error,
  onRetry,
  retrying,
  loadingMessage,
  children,
  className
}: ContentStateProps) {
  if (loading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <Spinner message={loadingMessage} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <InlineError message={error} onRetry={onRetry} retrying={retrying} />
      </div>
    )
  }

  return <>{children}</>
}
