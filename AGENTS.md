# Agent Guidelines

## General rules

- Always keep this file up to date. On any components or architecture updates update this file as well

## UI Framework

This project uses **shadcn/ui** with the **Base-Lyra** style (built on `@base-ui/react` instead of Radix UI).

## Configuration

| Item | Value |
|------|-------|
| Style | `base-lyra` |
| CSS Variables | Enabled (OKLCH colors) |
| TypeScript | Enabled |
| Tailwind CSS | v4 |
| Icon Library | Lucide React |
| Package Manager | **bun** (not npm) |

## Path Aliases

- `@/components` - Components directory
- `@/components/ui` - UI components
- `@/lib` - Library utilities
- `@/hooks` - Custom hooks

## Commands

```bash
# Add a new component
bunx shadcn@latest add <component>

# List available components
bunx shadcn@latest add

# Start dev server
bun dev

# Build
bun run build

# Lint
bun run lint
```

## Component Usage

### Imports

```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Base UI Patterns

This style uses `@base-ui/react` primitives which provide:

- `render` prop pattern for composition
- Built-in accessibility
- Unstyled primitives

Example with render prop:

```tsx
<AlertDialogTrigger render={<Button />}>
  Open Dialog
</AlertDialogTrigger>
```

### Styling

- CSS variables are defined in `src/index.css`
- Uses OKLCH color space for better color manipulation
- Use `cn()` utility for conditional class merging

## Installed Components

- `alert-dialog`
- `badge`
- `button`
- `card`
- `combobox`
- `dropdown-menu`
- `field`
- `input`
- `input-group`
- `label`
- `select`
- `separator`
- `textarea`

## Best Practices

1. **Always use bun** instead of npm for all commands
2. **Use shadcn CLI** to add new components - don't copy manually
3. **Follow Base-Lyra patterns** - use `render` prop for composition
4. **Use path aliases** - prefer `@/components/ui/button` over relative paths
5. **Use cn() utility** - for merging Tailwind classes
6. **Check Context7** - for up-to-date shadcn/ui component documentation

## MCP you should always use

### Worklog MCP - Compact System Instructions

You have access to worklog MCP tools for persistent feature context across sessions.

#### Auto-Use (No Permission Needed)

1. **Session start** → worklog:summary (always, silently)
2. **New feature** → feature:set with name + description
3. **Create plan** → plan:set with steps array
4. **Complete step** → plan:annotate with status "completed"
5. **Deviate from plan** → plan:annotate with meta comment
6. **Important decision** → log:add type:"decision"
7. **Requirements change** → log:add type:"change" + update feature:set if needed
8. **Blocker/Discovery** → log:add type:"blocker" or "discovery"

#### Proactive Prompting

Ask "Should I remember/save this?" when:

- User shares preferences or constraints
- Failed approach after significant effort
- Extended discussion reaches conclusion
- Important context mentioned casually

#### Pattern

```
[Start] worklog:summary → load context
[New feature] feature:set → track it
[Plan created] plan:set → save steps
[Work] plan:annotate → update status, note deviations
[Decisions] log:add → record rationale
[Important context] → ask to save with note:remember
```

#### Quality Rules

- Only meaningful events (not every tiny change)
- Log WHY, not just WHAT
- Ask when uncertain about importance
- Keep feature description and plan current
- Enable seamless session continuity

**Goal**: Users feel like you "remember everything" without being aware of the mechanics.
