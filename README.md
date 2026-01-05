# Bookmarks Index

A browser extension that replaces the new tab page with an elegant, hierarchical bookmark manager.

## Features

- **Hierarchical organization**: User → Spaces → Groups → Bookmarks
- **Theme support**: Light, dark, and system preference
- **Full CRUD**: Create, edit, and delete spaces, groups, and bookmarks
- **Cloud sync**: Data synced to server via tRPC API

## Architecture

This repository contains the Chrome extension (frontend) only. Related repositories:

- **bookmarks-index-server** - Backend server (separate repository)
- **bookmarks-shared-types** - Shared TypeScript types for tRPC

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4 + shadcn/ui (Base-Lyra)
- Reatom v1000 (state management)
- Clerk (authentication)
- tRPC Client (API communication)
- nanoid (ID generation)
- Zod (validation)

## Quick Start

### Run as Web App (for development/testing)

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Run as Chrome Extension

```bash
# Build the extension
bun run build:extension

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
# 5. Open a new tab - it will show Bookmarks Index
```

## Environment Variables

Create a `.env.local` file with:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=https://your-server-url/trpc
```

## Scripts

| Command                   | Description              |
| ------------------------- | ------------------------ |
| `bun dev`                 | Start development server |
| `bun run build`           | Build for production     |
| `bun run build:extension` | Build Chrome extension   |
| `bun run build:watch`     | Build with watch mode    |
| `bun run preview`         | Preview production build |
| `bun run lint`            | Run ESLint               |
| `bun run tsc`             | Type check               |

## Project Structure

```
src/
├── api/                # tRPC client setup
├── app/                # App entry, auth guards
├── components/         # Shared UI components
├── domain/             # Domain entities (spaces, groups, bookmarks)
│   ├── spaces/
│   ├── groups/
│   └── bookmarks/
├── lib/                # Utilities
├── screens/            # Main application screens
├── shared/ui/          # shadcn/ui components
├── stores/             # Reatom state stores
└── types/              # TypeScript definitions
```

## Usage

1. **Login**: Sign in with Clerk authentication
2. **Spaces**: Create workspaces like "Work", "Personal", "Learning"
3. **Groups**: Organize bookmarks within spaces (e.g., "Development", "Design")
4. **Bookmarks**: Add your favorite links with title, URL, and description
5. **Theme**: Toggle between light/dark mode via the user menu

## License

MIT
