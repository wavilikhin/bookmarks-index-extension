import * as React from "react"
import { Trash2 } from "lucide-react"
import { SpacesSidebar } from "./spaces-sidebar"
import { GroupTabs } from "./group-tabs"
import { BookmarkGrid } from "./bookmark-grid"
import { UserMenu } from "./user-menu"
import { AddEditModal } from "./add-edit-modal"
import { EmptyState } from "./empty-state"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import type { Space, Group, Bookmark, EntityType } from "@/types"

// Store hooks
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { useSpaces, useSpaceActions } from "@/hooks/use-spaces"
import { useGroups, useGroupActions } from "@/hooks/use-groups"
import { useBookmarks, useBookmarkActions } from "@/hooks/use-bookmarks"
import { useTheme } from "@/hooks/use-theme"

interface ModalState {
  isOpen: boolean
  mode: "create" | "edit"
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

interface DeleteState {
  isOpen: boolean
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

/**
 * NewTabPage - Main layout component for the bookmark manager
 *
 * Architecture:
 * - Left sidebar: Spaces navigation
 * - Top: Group tabs + User menu
 * - Center: Bookmark grid
 *
 * State management uses Zustand stores with IndexedDB persistence.
 */
export function NewTabPage() {
  // Auth state
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // UI state
  const activeSpaceId = useUIStore((state) => state.activeSpaceId)
  const selectedGroupId = useUIStore((state) => state.selectedGroupId)
  const setActiveSpace = useUIStore((state) => state.setActiveSpace)
  const setSelectedGroup = useUIStore((state) => state.setSelectedGroup)

  // Theme
  const { theme, setTheme } = useTheme()

  // Data from stores
  const spaces = useSpaces()
  const groups = useGroups(activeSpaceId)
  const bookmarks = useBookmarks(selectedGroupId)

  // Actions
  const { createSpace, updateSpace, deleteSpace } = useSpaceActions()
  const { createGroup, updateGroup, deleteGroup } = useGroupActions()
  const { createBookmark, updateBookmark, deleteBookmark } = useBookmarkActions()

  // Modal states
  const [modalState, setModalState] = React.useState<ModalState>({
    isOpen: false,
    mode: "create",
    entityType: "space",
  })
  const [deleteState, setDeleteState] = React.useState<DeleteState>({
    isOpen: false,
    entityType: "space",
  })

  // Set initial active space when spaces load
  React.useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      setActiveSpace(spaces[0].id)
    }
  }, [spaces, activeSpaceId, setActiveSpace])

  // Set initial selected group when space changes or groups load
  React.useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroup(groups[0].id)
    } else if (groups.length === 0) {
      setSelectedGroup(null)
    }
  }, [groups, selectedGroupId, setSelectedGroup])

  // Reset selected group when space changes
  React.useEffect(() => {
    if (activeSpaceId && groups.length > 0) {
      // Check if current selected group belongs to active space
      const currentGroup = groups.find((g) => g.id === selectedGroupId)
      if (!currentGroup) {
        setSelectedGroup(groups[0].id)
      }
    }
  }, [activeSpaceId, groups, selectedGroupId, setSelectedGroup])

  // Modal handlers
  const openCreateModal = (entityType: EntityType) => {
    setModalState({ isOpen: true, mode: "create", entityType })
  }

  const openEditModal = (entityType: EntityType, entity: Space | Group | Bookmark) => {
    setModalState({ isOpen: true, mode: "edit", entityType, entity })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  const openDeleteDialog = (entityType: EntityType, entity: Space | Group | Bookmark) => {
    setDeleteState({ isOpen: true, entityType, entity })
  }

  const closeDeleteDialog = () => {
    setDeleteState((prev) => ({ ...prev, isOpen: false }))
  }

  // CRUD handlers
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      if (modalState.mode === "create") {
        switch (modalState.entityType) {
          case "space": {
            const newSpace = await createSpace({
              name: data.name,
              icon: data.icon || "📁",
              color: data.color,
            })
            setActiveSpace(newSpace.id)
            break
          }
          case "group": {
            if (activeSpaceId) {
              const newGroup = await createGroup({
                spaceId: activeSpaceId,
                name: data.name,
                icon: data.icon,
              })
              setSelectedGroup(newGroup.id)
            }
            break
          }
          case "bookmark":
            if (selectedGroupId) {
              await createBookmark({
                groupId: selectedGroupId,
                title: data.title,
                url: data.url,
                description: data.description,
              })
            }
            break
        }
      } else {
        // Edit mode
        const entity = modalState.entity
        if (!entity) return

        switch (modalState.entityType) {
          case "space":
            await updateSpace(entity.id, {
              name: data.name,
              icon: data.icon,
              color: data.color,
            })
            break
          case "group":
            await updateGroup(entity.id, {
              name: data.name,
              icon: data.icon,
            })
            break
          case "bookmark":
            await updateBookmark(entity.id, {
              title: data.title,
              url: data.url,
              description: data.description,
            })
            break
        }
      }
      closeModal()
    } catch (error) {
      console.error("Failed to save:", error)
    }
  }

  const handleDelete = async () => {
    const entity = deleteState.entity
    if (!entity) return

    try {
      switch (deleteState.entityType) {
        case "space": {
          await deleteSpace(entity.id, true)
          // Select another space if available
          const remainingSpaces = spaces.filter((s) => s.id !== entity.id)
          if (remainingSpaces.length > 0) {
            setActiveSpace(remainingSpaces[0].id)
          } else {
            setActiveSpace(null)
          }
          break
        }
        case "group": {
          await deleteGroup(entity.id, true)
          // Select another group if available
          const remainingGroups = groups.filter((g) => g.id !== entity.id)
          if (remainingGroups.length > 0) {
            setSelectedGroup(remainingGroups[0].id)
          } else {
            setSelectedGroup(null)
          }
          break
        }
        case "bookmark":
          await deleteBookmark(entity.id, true)
          break
      }
      closeDeleteDialog()
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  // Determine empty state
  const getEmptyState = () => {
    if (spaces.length === 0) return "no-spaces"
    if (groups.length === 0) return "no-groups"
    if (bookmarks.length === 0) return "no-bookmarks"
    return null
  }

  const emptyState = getEmptyState()

  if (!user) return null

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left sidebar - Spaces */}
      <SpacesSidebar
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        onSelectSpace={setActiveSpace}
        onAddSpace={() => openCreateModal("space")}
        onEditSpace={(space) => openEditModal("space", space)}
        onDeleteSpace={(space) => openDeleteDialog("space", space)}
      />

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar - Groups tabs + User menu */}
        <header className="flex items-center justify-between border-b border-border/50 bg-background">
          <div className="flex-1">
            {activeSpaceId && (
              <GroupTabs
                groups={groups}
                activeGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroup}
                onAddGroup={() => openCreateModal("group")}
                onEditGroup={(group) => openEditModal("group", group)}
                onDeleteGroup={(group) => openDeleteDialog("group", group)}
              />
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2 px-4 py-2">
            <UserMenu
              user={user}
              onSettings={() => console.log("Open settings")}
              onLogout={logout}
              theme={theme}
              onThemeChange={setTheme}
            />
          </div>
        </header>

        {/* Content area - Bookmark grid or empty state */}
        <div className="flex flex-1 overflow-auto">
          {emptyState ? (
            <EmptyState
              type={emptyState}
              onAction={() => {
                if (emptyState === "no-spaces") openCreateModal("space")
                else if (emptyState === "no-groups") openCreateModal("group")
                else openCreateModal("bookmark")
              }}
            />
          ) : (
            <BookmarkGrid
              bookmarks={bookmarks}
              onAddBookmark={() => openCreateModal("bookmark")}
              onEditBookmark={(bookmark) => openEditModal("bookmark", bookmark)}
              onDeleteBookmark={(bookmark) => openDeleteDialog("bookmark", bookmark)}
            />
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AddEditModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        entityType={modalState.entityType}
        mode={modalState.mode}
        entity={modalState.entity}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="size-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {deleteState.entityType}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState.entityType === "space" && (
                <>
                  This will permanently delete this space and all its groups and
                  bookmarks. This action cannot be undone.
                </>
              )}
              {deleteState.entityType === "group" && (
                <>
                  This will permanently delete this group and all its bookmarks.
                  This action cannot be undone.
                </>
              )}
              {deleteState.entityType === "bookmark" && (
                <>
                  This will permanently delete this bookmark. This action cannot
                  be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
