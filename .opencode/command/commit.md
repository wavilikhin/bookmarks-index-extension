---
description: Create a conventional commit for staged or all changes
---

Create a git commit following conventional commits specification.

## Instructions

1. **Determine files to commit:**
   - If user specifies files or patterns: stage ONLY those files
   - If user provides no file guidance: stage ALL changed files (`git add -A`)
   - User instructions about file selection are MANDATORY and override defaults

2. **Analyze changes:**
   - Run `git status` to see what will be committed
   - Run `git diff --staged` (or `git diff` before staging) to understand changes
   - Identify the primary purpose: feature, fix, refactor, docs, etc.

3. **Compose commit message using this format:**

   ```
   <type>[optional scope]: <description>

   [optional body]
   ```

   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

   **Scopes:** `auth`, `storage`, `ui`, `spaces`, `groups`, `bookmarks`, `extension`

   **Rules:**
   - Lowercase type and scope
   - Imperative mood ("add" not "added")
   - No period at end of description
   - Description max ~50 chars

4. **For significant changes, add a body:**
   - Explain WHAT changed and WHY (not how)
   - Max 2 sentences, information-dense
   - Helps future agents understand context from git history
   - Separate from description with blank line

5. **Breaking changes:**
   - Add `!` after type/scope: `feat(storage)!: migrate to IndexedDB`
   - Or add footer: `BREAKING CHANGE: description`

6. **Execute commit:**

   ```bash
   git add <files>  # or git add -A
   git commit -m "<type>(scope): description" -m "Body explaining what and why."
   ```

7. **If pre-commit hooks modify files:** retry commit once to include those changes

## Examples

Simple fix:

```bash
git add -A
git commit -m "fix(bookmarks): prevent duplicate entries on rapid clicks"
```

Feature with context:

```bash
git add src/components/new-tab/
git commit -m "feat(spaces): add color customization" -m "Allows users to assign colors to spaces for visual organization. Colors persist in IndexedDB and sync across sessions."
```

Refactor:

```bash
git add -A
git commit -m "refactor(hooks): extract shared selector logic into base hook" -m "Reduces duplication across use-spaces, use-groups, use-bookmarks by centralizing filter and sort operations."
```

## User Instructions

$ARGUMENTS
