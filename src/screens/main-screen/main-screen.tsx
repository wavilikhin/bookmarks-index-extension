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
import {
  activeSpaceIdAtom,
  selectedGroupIdAtom,
  themeAtom,
  sidebarCollapsedAtom,
  editingSpaceIdAtom,
  editingGroupIdAtom,
  draftSpaceAtom,
  draftGroupAtom,
  SPACE_ICONS,
  GROUP_ICONS,
  getRandomIcon
} from '@/stores/ui/atoms'
import { createSpace, updateSpace, deleteSpace, spacesAtom } from '@/domain/spaces'
import { groupsAtom, createGroup, updateGroup, deleteGroup } from '@/domain/groups'
import {
  bookmarksAtom,
  bookmarksLoadingAtom,
  bookmarksErrorAtom,
  loadBookmarks,
  createBookmark,
  deleteBookmark,
  updateBookmark
} from '@/domain/bookmarks'
import { ContentState, BookmarkSkeletonGrid } from '@/shared/ui'
import {
  setActiveSpace,
  setSelectedGroup,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setDraftSpace,
  clearDraftSpace,
  setDraftGroup,
  clearDraftGroup,
  startEditingSpace,
  cancelEditingSpace,
  finishEditingSpace,
  startEditingGroup,
  cancelEditingGroup,
  finishEditingGroup
} from '@/stores'

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
  const theme = themeAtom()
  const sidebarCollapsed = sidebarCollapsedAtom()
  const editingSpaceId = editingSpaceIdAtom()
  const editingGroupId = editingGroupIdAtom()
  const draftSpace = draftSpaceAtom()
  const draftGroup = draftGroupAtom()

  const allSpaces = spacesAtom()
  const allGroups = groupsAtom()
  const allBookmarks = bookmarksAtom()

  // Filter groups and bookmarks based on selection
  // Don't filter by draft space ID - it's not a real space
  const isRealSpace = activeSpaceId && activeSpaceId !== 'draft-space'
  const groups = isRealSpace ? allGroups.filter((g) => g().spaceId === activeSpaceId) : []
  const bookmarks = selectedGroupId ? allBookmarks.filter((b) => b().groupId === selectedGroupId).map((b) => b()) : []

  // Auto-select first group when space changes and has groups but no group selected
  const firstGroupId = groups.length > 0 ? groups[0]().id : null
  React.useEffect(() => {
    if (isRealSpace && firstGroupId && !selectedGroupId) {
      setSelectedGroup(firstGroupId)
    }
  }, [activeSpaceId, firstGroupId, selectedGroupId, isRealSpace])

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

  // Inline creation handlers - create draft locally (no API call yet)
  const handleAddSpace = () => {
    // Auto-expand sidebar if collapsed
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }

    const count = allSpaces.length + 1
    const draft = {
      id: 'draft-space',
      name: `Space ${count}`,
      icon: getRandomIcon(SPACE_ICONS),
      color: undefined
    }
    setDraftSpace(draft)
    setActiveSpace(draft.id)
  }

  const handleAddGroup = () => {
    // Can't add group without a real space (not draft)
    if (!activeSpaceId || activeSpaceId === 'draft-space') return
    const count = groups.length + 1
    const draft = {
      id: 'draft-group',
      spaceId: activeSpaceId,
      name: `Group ${count}`,
      icon: getRandomIcon(GROUP_ICONS)
    }
    setDraftGroup(draft)
    setSelectedGroup(draft.id)
  }

  // Inline edit save handlers - now actually create via API
  const handleSpaceSave = async (spaceId: string, name: string, icon: string) => {
    const trimmed = name.trim()
    if (spaceId === 'draft-space' && draftSpace) {
      // Creating new space from draft - clear draft first to avoid duplication
      clearDraftSpace()
      if (trimmed) {
        const newSpace = await createSpace({
          name: trimmed,
          icon: icon,
          color: draftSpace.color
        })
        if (newSpace) {
          setActiveSpace(newSpace.id)
        }
      }
    } else {
      // Editing existing space - save both name and icon
      if (trimmed) {
        await updateSpace(spaceId, { name: trimmed, icon })
      }
      finishEditingSpace()
    }
  }

  const handleGroupNameSave = async (groupId: string, name: string) => {
    const trimmed = name.trim()
    if (groupId === 'draft-group' && draftGroup) {
      // Creating new group from draft - clear draft first to avoid duplication
      const draft = { ...draftGroup }
      clearDraftGroup()
      if (trimmed) {
        const newGroupId = await createGroup({
          spaceId: draft.spaceId,
          name: trimmed,
          icon: draft.icon
        })
        if (newGroupId) {
          setSelectedGroup(newGroupId)
        }
      }
    } else {
      // Editing existing group
      if (trimmed) {
        await updateGroup(groupId, { name: trimmed })
      }
      finishEditingGroup()
    }
  }

  // Inline edit cancel handlers
  const handleSpaceCancel = (spaceId: string) => {
    if (spaceId === 'draft-space') {
      // Cancel draft - just clear it
      clearDraftSpace()
      // Select another space if available
      setActiveSpace(allSpaces.length > 0 ? allSpaces[0]().id : null)
    } else {
      // Cancel edit of existing space - just exit edit mode (do NOT delete)
      cancelEditingSpace()
    }
  }

  const handleGroupCancel = (groupId: string) => {
    if (groupId === 'draft-group') {
      // Cancel draft - just clear it
      clearDraftGroup()
      // Select another group if available
      setSelectedGroup(groups.length > 0 ? groups[0]().id : null)
    } else {
      // Cancel edit of existing group - just exit edit mode (do NOT delete)
      cancelEditingGroup()
    }
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

  // Determine empty state - only for spaces and groups, not bookmarks
  // (empty bookmarks shows regular grid with add button)
  const getEmptyState = () => {
    // No spaces at all (excluding draft)
    if (allSpaces.length === 0 && !draftSpace) return 'no-spaces'
    // Currently on a draft space - don't show "no groups" until space is saved
    if (activeSpaceId === 'draft-space') return null
    // No space selected but spaces exist
    if (!activeSpaceId && allSpaces.length > 0) return null
    // Real space selected but has no groups
    if (isRealSpace && groups.length === 0) return 'no-groups'
    return null
  }

  const emptyState = getEmptyState()

  // Bookmarks loading/error state
  const bookmarksLoading = bookmarksLoadingAtom()
  const bookmarksError = bookmarksErrorAtom()

  // Render sidebar slot
  const sidebarSlot = (
    <SpacesSidebar
      spaces={allSpaces}
      draftSpace={draftSpace}
      activeSpaceId={activeSpaceId}
      isCollapsed={sidebarCollapsed}
      editingSpaceId={editingSpaceId}
      onSelectSpace={setActiveSpace}
      onAddSpace={handleAddSpace}
      onEditSpace={(space) => startEditingSpace(space)}
      onDeleteSpace={(space) => openDeleteDialog('space', space)}
      onToggleCollapse={toggleSidebar}
      onSpaceSave={handleSpaceSave}
      onSpaceCancel={handleSpaceCancel}
    />
  )

  // Render header slot
  const headerSlot = (
    <div className="flex items-center gap-2 px-4 py-2">
      <UserMenu onSettings={() => console.log('Open settings')} theme={theme} onThemeChange={setTheme} />
    </div>
  )

  // Render content

  return (
    <>
      <MainLayout sidebar={sidebarSlot} header={headerSlot}>
        <ContentState
          loading={bookmarksLoading}
          error={bookmarksError}
          onRetry={() => loadBookmarks()}
          skeleton={<BookmarkSkeletonGrid count={8} />}
        >
          {emptyState ? (
            <EmptyState
              type={emptyState}
              onAction={() => {
                if (emptyState === 'no-spaces') handleAddSpace()
                else if (emptyState === 'no-groups') handleAddGroup()
                else openCreateModal('bookmark')
              }}
            />
          ) : (
            <div className="flex w-full flex-1 flex-col items-center pt-[25vh]">
              {activeSpaceId && (
                <GroupTabs
                  groups={groups}
                  draftGroup={draftGroup}
                  activeGroupId={selectedGroupId}
                  editingGroupId={editingGroupId}
                  onSelectGroup={setSelectedGroup}
                  onAddGroup={handleAddGroup}
                  onEditGroup={(group) => startEditingGroup(group)}
                  onDeleteGroup={(group) => openDeleteDialog('group', group)}
                  onGroupNameSave={handleGroupNameSave}
                  onGroupNameCancel={handleGroupCancel}
                  className="mb-4"
                />
              )}
              <BookmarkGrid
                bookmarks={bookmarks}
                onAddBookmark={() => openCreateModal('bookmark')}
                onEditBookmark={(bookmark) => openEditModal('bookmark', bookmark)}
                onDeleteBookmark={(bookmark) => openDeleteDialog('bookmark', bookmark)}
              />
            </div>
          )}
        </ContentState>
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
