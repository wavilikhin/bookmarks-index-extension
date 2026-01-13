import { useUser, useClerk } from '@clerk/chrome-extension'
import { Sun, Moon, Monitor, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/shared/ui'
import type { Theme } from '@/stores'

interface UserSettingsMenuProps {
  isCollapsed: boolean
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/**
 * UserSettingsMenu - Unified settings menu in sidebar
 *
 * Displays user avatar (and name when expanded) as trigger.
 * Opens dropdown with theme toggle, account settings, and logout.
 */
export function UserSettingsMenu({ isCollapsed, theme, onThemeChange }: UserSettingsMenuProps) {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()

  const avatarUrl = user?.imageUrl
  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              'flex h-10 w-full items-center rounded-lg hover:bg-muted',
              'transition-all duration-300',
              isCollapsed ? 'justify-center' : 'pr-3'
            )}
          />
        }
      >
        {/* Avatar wrapper - fixed size, centered in container, stays in place during collapse */}
        <span
          className={cn('flex shrink-0 items-center justify-center', 'transition-all duration-300 ease-out')}
          style={{ width: '2.5rem', height: '2.5rem' }}
        >
          <img
            src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
            alt={userName}
            className="size-10 rounded-full object-cover"
            style={{ width: '40px', height: '40px' }}
          />
        </span>
        {/* Name - fades early (120ms), no width collapse to prevent reflow */}
        <span
          className={cn(
            'flex-1 truncate whitespace-nowrap text-sm font-medium text-foreground overflow-hidden',
            'transition-opacity duration-120 ease-out',
            isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          {userName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-64">
        {/* User header section */}
        <div className="flex items-center gap-3 px-3 py-3">
          <img
            src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
            alt={userName}
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{userName}</span>
            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Theme toggle row */}
        <div className="px-2 py-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <Button
              variant={theme === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThemeChange('light')}
              className="flex-1 gap-1.5"
            >
              <Sun className="size-3.5" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThemeChange('dark')}
              className="flex-1 gap-1.5"
            >
              <Moon className="size-3.5" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              variant={theme === 'system' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThemeChange('system')}
              className="flex-1 gap-1.5"
            >
              <Monitor className="size-3.5" />
              <span className="text-xs">Auto</span>
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Account Settings */}
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <User className="mr-2 size-4" />
          Account Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Log out */}
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { UserSettingsMenuProps }
