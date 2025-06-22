const z = require("zod");

const addStatsSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  stats: z
    .array(z.string().max(100, "Each stat must be at most 100 characters long"))
    .min(1, "At least one stat is required")
    .max(50, "Cannot add more than 50 stats at once"),
});

const updateStatsSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  stats: z
    .array(z.string().max(100, "Each stat must be at most 100 characters long"))
    .max(50, "Stats array can have at most 50 entries"),
});
