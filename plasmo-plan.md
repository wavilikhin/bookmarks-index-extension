# Migration Plan: Vite → Plasmo Framework

## Overview

| Aspect       | Current                      | Target                       |
| ------------ | ---------------------------- | ---------------------------- |
| Build System | Vite 7.x                     | Plasmo                       |
| Tailwind     | v4 (Vite plugin)             | v3 (PostCSS)                 |
| Targets      | Chrome MV3                   | Chrome MV3 + Firefox MV3     |
| Entry Point  | `main.tsx` + manual mounting | `newtab.tsx` + auto-mounting |

---

## Phase 1: Dependency Changes

### 1.1 Install New Dependencies

```bash
bun add plasmo
bun add -D tailwindcss@3 postcss autoprefixer
```

### 1.2 Remove Old Dependencies

```bash
bun remove @tailwindcss/vite @vitejs/plugin-react vite
```

### 1.3 Final Dependency Diff

**Remove from `package.json`:**

```json
{
  "dependencies": {
    "@tailwindcss/vite": "^4.1.17",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.2.4"
  }
}
```

**Add to `package.json`:**

```json
{
  "dependencies": {
    "plasmo": "^0.89.x",
    "tailwindcss": "^3.4.x"
  },
  "devDependencies": {
    "postcss": "^8.4.x",
    "autoprefixer": "^10.4.x"
  }
}
```

---

## Phase 2: package.json Transformation

### New `package.json` structure:

```json
{
  "name": "bookmarks-index",
  "displayName": "Bookmarks Index",
  "version": "1.0.0",
  "description": "Organize your bookmarks with Spaces and Groups - Replace your new tab with a beautiful bookmark manager",
  "author": "Your Name <email@example.com>",
  "type": "module",
  "scripts": {
    "dev": "plasmo dev",
    "dev:firefox": "plasmo dev --target=firefox-mv3",
    "build": "plasmo build",
    "build:firefox": "plasmo build --target=firefox-mv3",
    "build:all": "plasmo build && plasmo build --target=firefox-mv3",
    "package": "plasmo package",
    "package:firefox": "plasmo package --target=firefox-mv3",
    "package:all": "plasmo package && plasmo package --target=firefox-mv3",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "tsc": "tsc --noEmit",
    "format": "prettier --write ."
  },
  "manifest": {
    "permissions": ["storage"],
    "host_permissions": ["$PLASMO_PUBLIC_API_URL/*"],
    "content_security_policy": {
      "extension_pages": "script-src 'self'; object-src 'self'"
    }
  }
}
```

---

## Phase 3: File Structure Changes

### 3.1 Files to Create

| File                 | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `src/newtab.tsx`     | New tab page entry point (Plasmo convention)       |
| `src/style.css`      | Renamed from `index.css`, converted to Tailwind v3 |
| `assets/icon.png`    | Single high-res icon (Plasmo auto-generates sizes) |
| `postcss.config.js`  | PostCSS configuration for Tailwind                 |
| `tailwind.config.js` | Tailwind v3 configuration                          |

### 3.2 Files to Delete

| File                   | Reason                                        |
| ---------------------- | --------------------------------------------- |
| `vite.config.ts`       | Replaced by Plasmo                            |
| `index.html`           | Plasmo generates HTML automatically           |
| `public/manifest.json` | Plasmo generates manifest from `package.json` |
| `public/icons/`        | Replaced by single `assets/icon.png`          |
| `tsconfig.app.json`    | Replaced by Plasmo's tsconfig base            |
| `tsconfig.node.json`   | Not needed with Plasmo                        |
| `src/main.tsx`         | Replaced by `src/newtab.tsx`                  |
| `src/vite-env.d.ts`    | Not needed with Plasmo                        |

### 3.3 Files to Modify

| File                | Changes                               |
| ------------------- | ------------------------------------- |
| `tsconfig.json`     | Extend Plasmo base, update paths      |
| `.gitignore`        | Add `.plasmo/`, `build/`              |
| `.env.example`      | Rename variables to `PLASMO_PUBLIC_*` |
| `src/api/client.ts` | Update env var reference              |
| `components.json`   | Update CSS path reference             |

---

## Phase 4: Configuration Files

### 4.1 New `tsconfig.json`

```json
{
  "extends": "plasmo/templates/tsconfig.base",
  "exclude": ["node_modules"],
  "include": [".plasmo/index.d.ts", "./**/*.ts", "./**/*.tsx"],
  "compilerOptions": {
    "paths": {
      "~*": ["./src/*"],
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  }
}
```

### 4.2 New `postcss.config.js`

```js
/**
 * @type {import('postcss').ProcessOptions}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 4.3 New `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif']
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tw-animate-css')]
}
```

---

## Phase 5: CSS Migration (Tailwind v4 → v3)

### New `src/style.css`

Key changes from v4:

- `@import 'tailwindcss'` → `@tailwind base/components/utilities`
- Removed `@theme inline { ... }` block (moved to `tailwind.config.js`)
- Removed `@custom-variant dark` (using `darkMode: 'class'` in config)
- Converted `oklch()` colors to `hsl()` format for shadcn compatibility
- Updated scrollbar utilities to use `hsl(var(...))` syntax

---

## Phase 6: Entry Point Transformation

### New `src/newtab.tsx`

```tsx
import { ClerkProvider } from '@clerk/clerk-react'

import App from './app/App'

import './style.css'

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Add PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env')
}

function NewTabPage() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  )
}

export default NewTabPage
```

Key differences from `main.tsx`:

- No manual `createRoot()` / mounting - Plasmo handles it
- Uses `process.env.PLASMO_PUBLIC_*` instead of `import.meta.env.VITE_*`
- Export default component

---

## Phase 7: Environment Variables

### New `.env.example`

```bash
# API Configuration
PLASMO_PUBLIC_API_URL=http://localhost:3000/trpc

# Clerk Configuration
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Firefox Extension ID (required for Firefox - add after registering)
# FIREFOX_EXT_ID=your-extension@example.com
```

### Code Updates Required

Find and replace in source files:

- `import.meta.env.VITE_API_URL` → `process.env.PLASMO_PUBLIC_API_URL`
- `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` → `process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY`

---

## Phase 8: Build Output Reference

### Development

```bash
bun dev                    # Chrome: build/chrome-mv3-dev/
bun dev:firefox           # Firefox: build/firefox-mv3-dev/
```

### Production

```bash
bun run build             # Chrome: build/chrome-mv3-prod/
bun run build:firefox     # Firefox: build/firefox-mv3-prod/
bun run build:all         # Both browsers
```

### Packaging for Store

```bash
bun run package           # Creates .zip for Chrome Web Store
bun run package:firefox   # Creates .zip for Firefox Add-ons
bun run package:all       # Both
```

---

## Phase 9: Verification Checklist

After migration, verify:

| Feature           | Test Method                                         |
| ----------------- | --------------------------------------------------- |
| Extension loads   | Load unpacked from `build/chrome-mv3-dev/`          |
| New tab override  | Open new tab, see your app                          |
| Clerk auth works  | Sign in / sign out                                  |
| API calls work    | Perform CRUD operations                             |
| Dark mode toggle  | Toggle theme, verify styles                         |
| All UI components | Navigate through app                                |
| Firefox support   | Test with Firefox Developer Edition                 |
| Hot reload        | Make code change, see update                        |
| Production build  | `bun run build`, load from `build/chrome-mv3-prod/` |

---

## Migration Execution Order

1. Create backup - Git branch
2. Update dependencies - Remove Vite, add Plasmo/Tailwind v3
3. Create new config files - `postcss.config.js`, `tailwind.config.js`, update `tsconfig.json`
4. Create entry point - `src/newtab.tsx`
5. Migrate CSS - Create `src/style.css` with Tailwind v3 syntax
6. Update package.json - Scripts, manifest overrides, metadata
7. Update env files - Rename variables
8. Update code references - `import.meta.env` → `process.env`
9. Update components.json - CSS path
10. Setup assets - Create `assets/` folder, icon placeholder
11. Delete old files - Vite config, old entry points, etc.
12. Update .gitignore
13. Test build

---

## Notes

- Firefox extension ID will be added after registering in Firefox Add-ons store
- Color conversion from oklch to hsl is approximate - may need fine-tuning
- Placeholder icon will be replaced with actual branding later
