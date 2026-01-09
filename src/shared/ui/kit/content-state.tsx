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
  skeleton?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * ContentState - Utility component handling loading/error/content states
 *
 * Renders appropriate UI based on current state:
 * - Loading: Shows skeleton if provided, otherwise centered spinner
 * - Error: Shows inline error with retry button
 * - Content: Renders children
 */
export function ContentState({
  loading,
  error,
  onRetry,
  retrying,
  loadingMessage,
  skeleton,
  children,
  className
}: ContentStateProps) {
  if (loading) {
    // Prefer skeleton over spinner for smoother loading experience
    if (skeleton) {
      return <>{skeleton}</>
    }
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
