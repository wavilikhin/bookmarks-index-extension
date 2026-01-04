import { Settings, Moon, Sun, Monitor } from 'lucide-react'
import { UserButton } from '@clerk/chrome-extension'
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/shared/ui'

interface UserMenuProps {
  onSettings: () => void
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

/**
 * UserMenu - Top-right user account area with Clerk UserButton
 *
 * Design: Uses Clerk's UserButton for avatar and account management.
 * Separate dropdown for app-specific settings like theme.
 */
export function UserMenu({ onSettings, theme, onThemeChange }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Theme and settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-9 rounded-full" />}>
          {theme === 'dark' ? (
            <Moon className="size-4" />
          ) : theme === 'light' ? (
            <Sun className="size-4" />
          ) : (
            <Monitor className="size-4" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-48">
          {/* Theme submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'dark' ? (
                <Moon className="mr-2 size-4" />
              ) : theme === 'light' ? (
                <Sun className="mr-2 size-4" />
              ) : (
                <Monitor className="mr-2 size-4" />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => onThemeChange(value as 'light' | 'dark' | 'system')}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 size-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 size-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 size-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clerk UserButton - handles avatar, profile, sign out */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-9',
            userButtonTrigger: 'rounded-full'
          }
        }}
      />
    </div>
  )
}

export type { UserMenuProps }
