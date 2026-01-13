# TODO

Track progress here. Update after each run.

## Current Focus

All required phases complete. Phase 4 is optional (code smell cleanup).

## Next Up

- Phase 4 (optional): Convert UI helper functions to actions or update documentation

## Completed

- Phase 1: Add wrap() to all API calls
  - ✅ spaces.model.ts - 5 API calls wrapped
  - ✅ groups.model.ts - 5 API calls wrapped
  - ✅ bookmarks.model.ts - 6 API calls wrapped (reorderBookmarks, moveBookmark fixed)
- Phase 2: Refactor async state management
  - ✅ Removed manual loading/error atoms from all 3 model files
  - ✅ Simplified load actions to use withAsync()
  - ✅ Updated domain index files to remove loading/error atom exports
  - ✅ Updated components to use withAsync() state (main-screen, spaces-sidebar, group-tabs)
  - ✅ Updated data-atoms.ts to remove manual loading atom management
  - ✅ No TypeScript errors
- Phase 3: Add error handling to data-atoms
  - ✅ Added wrap() import to data-atoms.ts
  - ✅ Wrapped api.sync.ensureUser.mutate() call with wrap()
  - ✅ No TypeScript errors
  - ✅ No lint errors

## Blocked

None
