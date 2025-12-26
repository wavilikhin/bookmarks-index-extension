# Commit Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification (v1.0.0).

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type       | Description                                             | SemVer |
| ---------- | ------------------------------------------------------- | ------ |
| `feat`     | New feature                                             | MINOR  |
| `fix`      | Bug fix                                                 | PATCH  |
| `docs`     | Documentation only                                      | -      |
| `style`    | Code style (formatting, semicolons, etc.)               | -      |
| `refactor` | Code change that neither fixes a bug nor adds a feature | -      |
| `perf`     | Performance improvement                                 | -      |
| `test`     | Adding or updating tests                                | -      |
| `build`    | Build system or external dependencies                   | -      |
| `ci`       | CI configuration                                        | -      |
| `chore`    | Other changes that don't modify src or test files       | -      |
| `revert`   | Reverts a previous commit                               | -      |

## Scopes

Optional scopes for this project:

- `auth` - Authentication components/logic
- `storage` - IndexedDB storage layer
- `ui` - UI components
- `spaces` - Spaces feature
- `groups` - Groups feature
- `bookmarks` - Bookmarks feature
- `extension` - Chrome extension specific

## Breaking Changes

Breaking changes correlate with MAJOR in SemVer. Indicate them by:

1. Adding `!` after type/scope: `feat!:` or `feat(api)!:`
2. Adding `BREAKING CHANGE:` footer

## Examples

```bash
# Feature
feat: add drag-and-drop bookmark reordering

# Feature with scope
feat(spaces): add space color customization

# Bug fix
fix: prevent duplicate bookmarks on rapid clicks

# Breaking change with !
feat(storage)!: migrate from localStorage to IndexedDB

# Breaking change with footer
feat: change bookmark data structure

BREAKING CHANGE: `url` field renamed to `href`

# Documentation
docs: update README with extension install instructions

# Refactor
refactor(hooks): extract common selector logic

# Multiple footers
fix: resolve race condition in bookmark sync

Reviewed-by: @username
Refs: #42
```

## Rules

1. Use lowercase for type and scope
2. Use imperative mood in description ("add" not "added")
3. Don't end description with a period
4. Separate body from description with a blank line
5. Wrap body at 72 characters
6. Use body to explain _what_ and _why_, not _how_

## Multi-type Commits

If a commit addresses multiple concerns, split it into separate commits when possible.
