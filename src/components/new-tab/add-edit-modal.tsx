import * as React from "react"
import { Bookmark, FolderOpen, Layers } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { Space, Group, Bookmark as BookmarkType, EntityType } from "@/types"

// Placeholder types for each entity
type PlaceholderConfig = {
  name?: string
  icon?: string
  title?: string
  url?: string
}

// Entity type configurations
const entityConfig: Record<
  EntityType,
  {
    icon: typeof Layers | typeof FolderOpen | typeof Bookmark
    label: string
    placeholders: PlaceholderConfig
  }
> = {
  space: {
    icon: Layers,
    label: "Space",
    placeholders: {
      name: "e.g., Work, Personal",
      icon: "e.g., 💼, 🏠, 📚",
    },
  },
  group: {
    icon: FolderOpen,
    label: "Group",
    placeholders: {
      name: "e.g., Development, Design",
    },
  },
  bookmark: {
    icon: Bookmark,
    label: "Bookmark",
    placeholders: {
      title: "e.g., GitHub",
      url: "https://github.com",
    },
  },
}

interface AddEditModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: EntityType
  mode: "create" | "edit"
  entity?: Space | Group | BookmarkType
  onSubmit: (data: Record<string, string>) => void
}

/**
 * AddEditModal - Reusable modal for CRUD operations
 * 
 * Design: Clean, focused dialog with contextual icon.
 * Validates required fields before submission.
 */
export function AddEditModal({
  isOpen,
  onClose,
  entityType,
  mode,
  entity,
  onSubmit,
}: AddEditModalProps) {
  const config = entityConfig[entityType]
  const Icon = config.icon

  const [formData, setFormData] = React.useState<Record<string, string>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Initialize form data when entity changes
  React.useEffect(() => {
    if (mode === "edit" && entity) {
      const data: Record<string, string> = {}
      if ("name" in entity) data.name = entity.name
      if ("icon" in entity) data.icon = (entity as Space).icon
      if ("title" in entity) data.title = (entity as BookmarkType).title
      if ("url" in entity) data.url = (entity as BookmarkType).url
      setFormData(data)
    } else {
      setFormData({})
    }
    setErrors({})
  }, [mode, entity, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields based on entity type
    const newErrors: Record<string, string> = {}
    
    if (entityType === "space") {
      if (!formData.name?.trim()) newErrors.name = "Name is required"
      if (!formData.icon?.trim()) newErrors.icon = "Icon is required"
    } else if (entityType === "group") {
      if (!formData.name?.trim()) newErrors.name = "Name is required"
    } else if (entityType === "bookmark") {
      if (!formData.title?.trim()) newErrors.title = "Title is required"
      if (!formData.url?.trim()) newErrors.url = "URL is required"
    }

    // Validate URL format for bookmarks
    if (entityType === "bookmark" && formData.url) {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = "Please enter a valid URL"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
    onClose()
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/10 backdrop-blur-xs",
            "data-open:animate-in data-closed:animate-out",
            "data-closed:fade-out-0 data-open:fade-in-0",
            "duration-150"
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2",
            "bg-background ring-1 ring-border/50 shadow-xl",
            "rounded-lg p-0 outline-none",
            "data-open:animate-in data-closed:animate-out",
            "data-closed:fade-out-0 data-open:fade-in-0",
            "data-closed:zoom-out-95 data-open:zoom-in-95",
            "duration-150"
          )}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-sm font-medium">
                  {mode === "create" ? `Add ${config.label}` : `Edit ${config.label}`}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  {mode === "create"
                    ? `Create a new ${config.label.toLowerCase()}`
                    : `Update ${config.label.toLowerCase()} details`}
                </DialogPrimitive.Description>
              </div>
            </div>

            {/* Form fields */}
            <div className="flex flex-col gap-4 px-5 py-5">
              {entityType === "space" && (
                <>
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder={config.placeholders.name}
                      autoFocus
                    />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </Field>
                  <Field data-invalid={!!errors.icon}>
                    <FieldLabel htmlFor="icon">Icon (emoji)</FieldLabel>
                    <Input
                      id="icon"
                      value={formData.icon || ""}
                      onChange={(e) => handleChange("icon", e.target.value)}
                      placeholder={config.placeholders.icon}
                      maxLength={4}
                    />
                    {errors.icon && <FieldError>{errors.icon}</FieldError>}
                  </Field>
                </>
              )}

              {entityType === "group" && (
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder={config.placeholders.name}
                    autoFocus
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </Field>
              )}

              {entityType === "bookmark" && (
                <>
                  <Field data-invalid={!!errors.title}>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <Input
                      id="title"
                      value={formData.title || ""}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder={config.placeholders.title}
                      autoFocus
                    />
                    {errors.title && <FieldError>{errors.title}</FieldError>}
                  </Field>
                  <Field data-invalid={!!errors.url}>
                    <FieldLabel htmlFor="url">URL</FieldLabel>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url || ""}
                      onChange={(e) => handleChange("url", e.target.value)}
                      placeholder={config.placeholders.url}
                    />
                    {errors.url && <FieldError>{errors.url}</FieldError>}
                  </Field>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border/50 px-5 py-4">
              <DialogPrimitive.Close
                render={<Button type="button" variant="outline" />}
              >
                Cancel
              </DialogPrimitive.Close>
              <Button type="submit">
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export type { AddEditModalProps }
