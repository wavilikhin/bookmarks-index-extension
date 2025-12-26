import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Bookmark } from "@/types";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * BookmarkItem - Individual bookmark circle with favicon
 *
 * Design: Chrome-inspired circular favicon display with title below.
 * Hover reveals subtle elevation and context menu.
 * The favicon container has a soft background for loading/missing states.
 */
export function BookmarkItem({
  bookmark,
  onEdit,
  onDelete,
}: BookmarkItemProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const handleClick = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  // Generate initials from title for fallback
  const initials = bookmark.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "group relative flex w-24 flex-col items-center gap-2 rounded-lg p-3 transition-all duration-200",
        "cursor-pointer select-none",
        "hover:bg-muted/50",
      )}
    >
      {/* Favicon circle */}
      <div
        onClick={handleClick}
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full transition-all duration-200",
          "bg-muted/70 ring-1 ring-border/50",
          "group-hover:shadow-md group-hover:shadow-foreground/5 group-hover:ring-border",
        )}
      >
        {/* Loading skeleton */}
        {!imgLoaded && !imgError && bookmark.faviconUrl && (
          <div className="absolute inset-0 animate-pulse rounded-full bg-muted" />
        )}

        {/* Favicon image */}
        {bookmark.faviconUrl && !imgError ? (
          <img
            src={bookmark.faviconUrl}
            alt=""
            className={cn(
              "size-7 rounded-sm object-contain transition-opacity duration-200",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback: initials
          <span className="text-sm font-semibold text-muted-foreground">
            {initials || "?"}
          </span>
        )}

        {/* Hover overlay with external link indicator */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-foreground/80 opacity-0 transition-opacity",
            "group-hover:opacity-100",
          )}
        >
          <ExternalLink className="size-4 text-background" />
        </div>
      </div>

      {/* Title */}
      <span
        onClick={handleClick}
        className="max-w-full truncate text-center text-xs text-muted-foreground transition-colors group-hover:text-foreground"
        title={bookmark.title}
      >
        {bookmark.title}
      </span>

      {/* Context menu */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger
          render={
            <button
              className={cn(
                "absolute right-1 top-1 flex size-6 items-center justify-center rounded-md bg-background/80 opacity-0 shadow-sm ring-1 ring-border/50 backdrop-blur-sm transition-opacity",
                "hover:bg-muted focus:opacity-100 group-hover:opacity-100",
                showMenu && "opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <MoreHorizontal className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="mr-2 size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type { BookmarkItemProps };
