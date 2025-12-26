// Zod schemas for input validation
import { z } from "zod";

// Space validation schema
export const spaceInputSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  icon: z.string().min(1, "Icon is required").max(4, "Icon must be an emoji"),
  color: z.string().optional(),
});

// Group validation schema
export const groupInputSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  icon: z.string().optional(),
});

// Bookmark validation schema
export const bookmarkInputSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  url: z
    .string()
    .min(1, "URL is required")
    .refine(
      (val) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL" },
    ),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

// Username validation for login
export const usernameSchema = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must be 30 characters or less")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens",
  );

// Export types from schemas
export type SpaceInput = z.infer<typeof spaceInputSchema>;
export type GroupInput = z.infer<typeof groupInputSchema>;
export type BookmarkInput = z.infer<typeof bookmarkInputSchema>;
