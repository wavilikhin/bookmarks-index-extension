import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia
} from '@/shared/ui'
import type { EntityType } from '@/types'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  entityType: EntityType
  onClose: () => void
  onConfirm: () => void
}

const ENTITY_DESCRIPTIONS: Record<EntityType, string> = {
  space: 'This will permanently delete this space and all its groups and bookmarks. This action cannot be undone.',
  group: 'This will permanently delete this group and all its bookmarks. This action cannot be undone.',
  bookmark: 'This will permanently delete this bookmark. This action cannot be undone.'
}

export function DeleteConfirmationDialog({ isOpen, entityType, onClose, onConfirm }: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <Trash2 className="size-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {entityType}?</AlertDialogTitle>
          <AlertDialogDescription>{ENTITY_DESCRIPTIONS[entityType]}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
