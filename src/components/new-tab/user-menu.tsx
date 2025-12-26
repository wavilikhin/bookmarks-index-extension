import {User, Settings, LogOut, Moon, Sun, Monitor} from "lucide-react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import type {User as UserType} from "@/types"
import {wrap} from "@reatom/core"
import {logout} from "@/stores/auth/actions"
import {reatomComponent} from "@reatom/react"

interface UserMenuProps {
  user: UserType
  onSettings: () => void
  theme: "light" | "dark" | "system"
  onThemeChange: (theme: "light" | "dark" | "system") => void
}

/**
 * UserMenu - Top-right user account dropdown
 *
 * Design: Minimal avatar circle that expands to show user info and settings.
 * Includes theme switcher and logout option.
 */
export const UserMenu = reatomComponent(
  ({user, onSettings, theme, onThemeChange}: UserMenuProps) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              className='size-9 rounded-full'
            />
          }
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className='size-7 rounded-full object-cover ring-1 ring-border'
            />
          ) : (
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                "bg-primary/10 text-primary ring-1 ring-primary/20"
              )}
            >
              <User className='size-4' />
            </div>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-56'
        >
          {/* User info header */}
          <div className='flex items-center gap-3 px-2 py-2.5'>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className='size-9 rounded-full object-cover ring-1 ring-border'
              />
            ) : (
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  "bg-primary/10 text-primary"
                )}
              >
                <User className='size-5' />
              </div>
            )}
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{user.username}</span>
              <span className='text-xs text-muted-foreground'>{user.email ?? "Local storage"}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Theme submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className='mr-2 size-4' />
              ) : theme === "light" ? (
                <Sun className='mr-2 size-4' />
              ) : (
                <Monitor className='mr-2 size-4' />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => onThemeChange(value as "light" | "dark" | "system")}
              >
                <DropdownMenuRadioItem value='light'>
                  <Sun className='mr-2 size-4' />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='dark'>
                  <Moon className='mr-2 size-4' />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='system'>
                  <Monitor className='mr-2 size-4' />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Settings */}
          <DropdownMenuItem onClick={onSettings}>
            <Settings className='mr-2 size-4' />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem onClick={wrap(logout)}>
            <LogOut className='mr-2 size-4' />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
  "UserMenu"
)

export type {UserMenuProps}
