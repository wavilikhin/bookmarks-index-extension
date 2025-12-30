import * as React from 'react'
import { reatomComponent } from '@reatom/react'
import { MainLayout } from '@/app/layout/main-layout'
import { SpacesSidebar } from './ui/spaces-sidebar'
import { GroupTabs } from './ui/group-tabs'
import { BookmarkGrid } from './ui/bookmark-grid'
import { UserMenu } from './ui/user-menu'
import { AddEditModal } from './ui/add-edit-modal'
import { EmptyState } from './ui/empty-state'
import { DeleteConfirmationDialog } from './ui/delete-confirmation-dialog'
import type { Space, Group, Bookmark, EntityType } from '@/types'

// Reatom atoms and actions
import { activeSpaceIdAtom, selectedGroupIdAtom } from '@/stores/ui/atoms'
import { createSpace, updateSpace, deleteSpace, spacesAtom } from '@/domain/spaces'
import { groupsAtom, createGroup, updateGroup, deleteGroup } from '@/domain/groups'
import { bookmarksAtom, createBookmark, deleteBookmark, updateBookmark } from '@/domain/bookmarks'
import { setActiveSpace, setSelectedGroup } from '@/stores'

interface ModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

interface DeleteState {
  isOpen: boolean
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

/**
 * MainScreen - Main entry point that composes all app components
 *
 * This component is responsible for:
 * - Composing layout with sidebar, header, and content
 * - Managing modal states (add/edit, delete confirmation)
 * - Coordinating CRUD operations between UI and domain
 */
export const MainScreen = reatomComponent(() => {
  // UI state from atoms
  const activeSpaceId = activeSpaceIdAtom()
  const selectedGroupId = selectedGroupIdAtom()

  const allSpaces = spacesAtom()
  const allGroups = groupsAtom()
  const allBookmarks = bookmarksAtom()

  // Filter groups and bookmarks based on selection
  const groups = activeSpaceId ? allGroups.filter((g) => g().spaceId === activeSpaceId) : []
  const bookmarks = selectedGroupId ? allBookmarks.filter((b) => b().groupId === selectedGroupId).map((b) => b()) : []

  // Modal states
  const [modalState, setModalState] = React.useState<ModalState>({
    isOpen: false,
    mode: 'create',
    entityType: 'space'
  })
  const [deleteState, setDeleteState] = React.useState<DeleteState>({
    isOpen: false,
    entityType: 'space'
  })

  // Theme state (temporary until moved to global store)
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')

  // Modal handlers
  const openCreateModal = (entityType: EntityType) => {
    setModalState({ isOpen: true, mode: 'create', entityType })
  }

  const openEditModal = (entityType: EntityType, entity: Space | Group | Bookmark) => {
    setModalState({ isOpen: true, mode: 'edit', entityType, entity })
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
      if (modalState.mode === 'create') {
        switch (modalState.entityType) {
          case 'space': {
            const newSpace = await createSpace({
              name: data.name,
              icon: data.icon || '📁',
              color: data.color
            })
            if (newSpace) {
              setActiveSpace(newSpace.id)
            }
            break
          }
          case 'group': {
            if (activeSpaceId) {
              const newGroupId = await createGroup({
                spaceId: activeSpaceId,
                name: data.name,
                icon: data.icon
              })
              if (newGroupId) {
                setSelectedGroup(newGroupId)
              }
            }
            break
          }
          case 'bookmark':
            if (selectedGroupId) {
              if (!activeSpaceId) return

              await createBookmark({
                spaceId: activeSpaceId,
                groupId: selectedGroupId,
                title: data.title,
                url: data.url,
                description: data.description
              })
            }
            break
        }
      } else {
        // Edit mode
        const entity = modalState.entity
        if (!entity) return

        switch (modalState.entityType) {
          case 'space':
            await updateSpace(entity.id, {
              name: data.name,
              icon: data.icon,
              color: data.color
            })
            break
          case 'group':
            await updateGroup(entity.id, {
              name: data.name,
              icon: data.icon
            })
            break
          case 'bookmark':
            await updateBookmark(entity.id, {
              title: data.title,
              url: data.url,
              description: data.description
            })
            break
        }
      }
      closeModal()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async () => {
    const entity = deleteState.entity
    if (!entity) return

    try {
      switch (deleteState.entityType) {
        case 'space': {
          await deleteSpace(entity.id)
          // Select another space if available
          const remainingSpaces = allSpaces.filter((s) => s().id !== entity.id)
          if (remainingSpaces.length > 0) {
            setActiveSpace(remainingSpaces[0]().id)
          } else {
            setActiveSpace(null)
          }
          break
        }
        case 'group': {
          await deleteGroup(entity.id)
          // Select another group if available
          const remainingGroups = groups.filter((g) => g()!.id !== entity.id)
          if (remainingGroups.length > 0) {
            setSelectedGroup(remainingGroups[0]().id)
          } else {
            setSelectedGroup(null)
          }
          break
        }
        case 'bookmark':
          await deleteBookmark(entity.id)
          break
      }
      closeDeleteDialog()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // Determine empty state
  const getEmptyState = () => {
    if (allSpaces.length === 0) return 'no-spaces'
    if (groups.length === 0) return 'no-groups'
    if (bookmarks.length === 0) return 'no-bookmarks'
    return null
  }

  const emptyState = getEmptyState()

  // Render sidebar slot
  const sidebarSlot = (
    <SpacesSidebar
      spaces={allSpaces}
      activeSpaceId={activeSpaceId}
      onSelectSpace={setActiveSpace}
      onAddSpace={() => openCreateModal('space')}
      onEditSpace={(space) => openEditModal('space', space)}
      onDeleteSpace={(space) => openDeleteDialog('space', space)}
    />
  )

  // Render header slot
  const headerSlot = (
    <>
      <div className="flex-1">
        {activeSpaceId && (
          <GroupTabs
            groups={groups}
            activeGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroup}
            onAddGroup={() => openCreateModal('group')}
            onEditGroup={(group) => openEditModal('group', group)}
            onDeleteGroup={(group) => openDeleteDialog('group', group)}
          />
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-2">
        <UserMenu onSettings={() => console.log('Open settings')} theme={theme} onThemeChange={setTheme} />
      </div>
    </>
  )

  // Render content

  return (
    <>
      <MainLayout sidebar={sidebarSlot} header={headerSlot}>
        {emptyState ? (
          <EmptyState
            type={emptyState}
            onAction={() => {
              if (emptyState === 'no-spaces') openCreateModal('space')
              else if (emptyState === 'no-groups') openCreateModal('group')
              else openCreateModal('bookmark')
            }}
          />
        ) : (
          <BookmarkGrid
            bookmarks={bookmarks}
            onAddBookmark={() => openCreateModal('bookmark')}
            onEditBookmark={(bookmark) => openEditModal('bookmark', bookmark)}
            onDeleteBookmark={(bookmark) => openDeleteDialog('bookmark', bookmark)}
          />
        )}
      </MainLayout>

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
      <DeleteConfirmationDialog
        isOpen={deleteState.isOpen}
        entityType={deleteState.entityType}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </>
  )
}, 'MainScreen')
