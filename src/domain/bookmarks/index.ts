// Bookmarks domain - consolidated exports
export type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './bookmarks.types'
export {
  bookmarksAtom,
  bookmarksLoadingAtom,
  bookmarksErrorAtom,
  loadBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
  moveBookmark
} from './bookmarks.model'
