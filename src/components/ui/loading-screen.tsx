import * as React from "react"
import {Loader2} from "lucide-react"

interface LoadingScreenProps {
  message?: string
}

/**
 * Full-screen loading state
 */
export const LoadingScreen = ({message = "Loading your bookmarks..."}: LoadingScreenProps) => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <div className='flex flex-col items-center gap-3'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>{message}</p>
      </div>
    </div>
  )
}

