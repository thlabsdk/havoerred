import { z } from 'zod';

export const catchSchema = z.object({
  date: z.string(),
  location: z.string().min(1, 'Location is required'),
  fjord: z.string(),
  bait: z.string().min(1, 'Bait is required'),
  lengthCm: z.number().nullable(),
  undersized: z.boolean(),
  windDirection: z.string(),
  notes: z.string(),
});

export type CatchFormData = z.infer<typeof catchSchema>;