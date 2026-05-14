import { z } from 'zod';
import { coerceLengthCm, optionalDateString } from './coerce';

const optionalSpotId = z.preprocess(
  (v) => (v === undefined ? null : v),
  z.number().int().nullable()
);

export const catchSchema = z.object({
  date: optionalDateString,
  location: z.string().min(1, 'Location is required'),
  fjord: z.string(),
  bait: z.string().min(1, 'Bait is required'),
  lengthCm: coerceLengthCm,
  undersized: z.boolean(),
  windDirection: z.string(),
  notes: z.string(),
  spotId: optionalSpotId,
});

export type CatchFormData = z.infer<typeof catchSchema>;
