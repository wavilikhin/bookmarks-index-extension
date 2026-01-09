import * as React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

/**
 * Full-screen loading state with static message
 */
export const LoadingScreen = ({ message = 'Loading your bookmarks...' }: LoadingScreenProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

/**
 * Funny loading phrases for the initial auth loading screen
 */
const LOADING_PHRASES = [
  'Waking up the bookmarks...',
  'Untangling the web...',
  'Convincing tabs to behave...',
  'Herding digital cats...',
  'Brewing some fresh links...',
  'Dusting off your favorites...',
  'Teaching URLs to sit...',
  'Polishing the pixels...',
  'Warming up the internet...',
  'Asking Chrome nicely...'
]

/**
 * GenericLoadingScreen - Initial loading screen with rotating funny phrases
 *
 * Used before authentication is checked - shows a generic loading state
 * without revealing app-specific UI (no spaces, groups, bookmarks skeletons).
 * Phrases rotate every 2.5 seconds to keep users entertained.
 */
export function GenericLoadingScreen() {
  const [phraseIndex, setPhraseIndex] = React.useState(() =>
    Math.floor(Math.random() * LOADING_PHRASES.length)
  )
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)

      // Wait for fade-out, then change phrase and fade-in
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length)
        setIsTransitioning(false)
      }, 200)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p
          className={`text-sm text-muted-foreground transition-opacity duration-200 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {LOADING_PHRASES[phraseIndex]}
        </p>
      </div>
    </div>
  )
}
