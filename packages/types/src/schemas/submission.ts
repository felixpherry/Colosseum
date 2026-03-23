import { z } from 'zod';

export const createSubmissionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be under 150 characters'),
  tournamentId: z.string(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
