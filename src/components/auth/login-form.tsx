import {Bookmark} from "lucide-react"
import {bindField, reatomComponent} from "@reatom/react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {login} from "@/stores/auth/actions"
import {usernameSchema} from "@/lib/utils/validators"
import {reatomForm, wrap} from "@reatom/core"
import z from "zod"

const loginForm = reatomForm(
  {
    username: "",
  },
  {
    name: "loginForm",
    schema: z.object({
      username: usernameSchema,
    }),
    validateOnBlur: true,
    onSubmit: async ({username}) => {
      console.log("loginForm.onSubmit", username)
      await wrap(login(username))
      loginForm.reset()
    },
  }
)

/**
 * LoginForm - Username-based authentication for local storage
 *
 * Uses a simple username input that creates or retrieves an existing user.
 * Data is isolated per username in IndexedDB.
 */
export const LoginForm = reatomComponent(() => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <div className='w-full max-w-sm space-y-8 px-4'>
        {/* Logo and title */}
        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10'>
            <Bookmark className='h-7 w-7 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
              Bookmarks Index
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Organize your bookmarks with spaces and groups
            </p>
          </div>
        </div>

        {/* Login form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loginForm.submit()
          }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              type='text'
              placeholder='Enter your username'
              {...bindField(loginForm.fields.username)}
            />
            {loginForm.fields.username.validation.errors().map((error) => (
              <p
                key={error.message}
                className='text-sm text-destructive'
              >
                {error.message}
              </p>
            ))}
          </div>

          <Button
            type='submit'
            className='w-full'
          >
            {login.pending() ? "Signing in..." : "Sign in"}
          </Button>

          <p className='text-center text-xs text-muted-foreground'>
            Your data is stored locally in your browser.
            <br />
            Use the same username to access your bookmarks.
          </p>
        </form>
      </div>
    </div>
  )
}, "LoginForm")
