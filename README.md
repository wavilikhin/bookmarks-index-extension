# Bookmarks Index

A browser extension that replaces the new tab page with an elegant, hierarchical bookmark manager.

## Features

- **Hierarchical organization**: User → Spaces → Groups → Bookmarks
- **Fake authentication**: Username-based, data stored locally in IndexedDB
- **Theme support**: Light, dark, and system preference
- **Sample data**: First-time users get pre-populated bookmarks
- **Full CRUD**: Create, edit, and delete spaces, groups, and bookmarks

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4 + shadcn/ui (Base-Lyra)
- Zustand (state management)
- IndexedDB via idb-keyval (storage)
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

## Scripts

| Command                   | Description              |
| ------------------------- | ------------------------ |
| `bun dev`                 | Start development server |
| `bun run build`           | Build for production     |
| `bun run build:extension` | Build Chrome extension   |
| `bun run build:watch`     | Build with watch mode    |
| `bun run preview`         | Preview production build |
| `bun run lint`            | Run ESLint               |

## Project Structure

```
src/
├── components/
│   ├── auth/           # Login form, auth guard
│   ├── new-tab/        # Main app components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/
│   ├── storage/        # IndexedDB layer
│   └── utils/          # Entity utilities, validators
├── stores/             # Zustand state stores
└── types/              # TypeScript definitions
```

## Usage

1. **Login**: Enter any username to get started (data is stored locally per username)
2. **Spaces**: Create workspaces like "Work", "Personal", "Learning"
3. **Groups**: Organize bookmarks within spaces (e.g., "Development", "Design")
4. **Bookmarks**: Add your favorite links with title, URL, and description
5. **Theme**: Toggle between light/dark mode via the user menu

## License

MIT
