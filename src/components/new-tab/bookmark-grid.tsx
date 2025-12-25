import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookmarkItem } from "./bookmark-item"
import type { Bookmark } from "@/types"

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmark: Bookmark) => void
}

/**
 * BookmarkGrid - Chrome-style grid of bookmark circles
 * 
 * Design: Centered grid that adapts to available space.
 * Includes an "Add" button as the last item.
 * Uses CSS Grid with responsive columns.
 */
export function BookmarkGrid({
  bookmarks,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
}: BookmarkGridProps) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 md:px-8">
      <div
        className={cn(
          "grid gap-2",
          // Responsive grid columns based on viewport
          "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        )}
      >
        {/* Bookmark items */}
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={() => onEditBookmark(bookmark)}
            onDelete={() => onDeleteBookmark(bookmark)}
          />
        ))}

        {/* Add bookmark button */}
        <AddBookmarkButton onClick={onAddBookmark} />
      </div>
    </div>
  )
}

interface AddBookmarkButtonProps {
  onClick: () => void
}

function AddBookmarkButton({ onClick }: AddBookmarkButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-24 flex-col items-center gap-2 rounded-lg p-3 transition-all duration-200",
        "cursor-pointer select-none",
        "hover:bg-muted/50"
      )}
    >
      {/* Dashed circle */}
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full transition-all duration-200",
          "border-2 border-dashed border-border",
          "group-hover:border-primary group-hover:bg-primary/5"
        )}
      >
        <Plus
          className={cn(
            "size-5 text-muted-foreground transition-colors",
            "group-hover:text-primary"
          )}
        />
      </div>

      {/* Label */}
      <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        Add
      </span>
    </button>
  )
}

export type { BookmarkGridProps }
