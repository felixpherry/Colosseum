import { z } from 'zod';

export const createTournamentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional(),
  category: z.string().min(1, 'Category is required'),
  size: z.union([z.literal(8), z.literal(16), z.literal(32), z.literal(64)]),
  matchupDurationHours: z.number().min(1).max(48),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
