import { z } from "zod";

export const addStatsSchema = z.object({
  stats: z
    .array(z.string().max(100, "Each stat must be at most 100 characters long"))
    .min(1, "At least one stat is required")
    .max(50, "Cannot add more than 50 stats at once"),
});

export const updateStatsSchema = z.object({
  stats: z
    .array(z.string().max(100, "Each stat must be at most 100 characters long"))
    .max(50, "Stats array can have at most 50 entries"),
});

export const addAchievementsSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => new Date(val)),
});

export const updateAchievementsSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title cannot exceed 255 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .nullable(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .transform((val) => new Date(val))
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const FileSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  title: z.string().min(1, "Title is required"),
  issuedBy: z.string().min(1, "Issued by is required"),
  url: z.string().url("Invalid URL"),
  originalName: z.string().min(1, "Original name is required").optional(),
  mimeType: z.string().min(1, "MIME type is required").optional(),
  size: z.number().positive("Size must be positive").optional(),
  uploadDate: z
    .date()
    .default(() => new Date())
    .optional(),
  metadata: z.record(z.any()).default({}).optional(),
});

export const ProfileSchema = z.object({
  sports: z.array(z.string()).optional(),
  bio: z.string().optional(),
  age: z.number().int().positive().optional(),
  location: z.string().optional(),
});
