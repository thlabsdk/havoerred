import { z } from 'zod';
import { coerceLengthCm, optionalDateString } from './coerce';

export const catchSchema = z.object({
  date: optionalDateString,
  location: z.string().min(1, 'Location is required'),
  fjord: z.string(),
  bait: z.string().min(1, 'Bait is required'),
  lengthCm: coerceLengthCm,
  undersized: z.boolean(),
  windDirection: z.string(),
  notes: z.string(),
});

export type CatchFormData = z.infer<typeof catchSchema>;
