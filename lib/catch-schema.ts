import { z } from 'zod';
import { coerceLengthCm, optionalDateString, optionalTimeString } from './coerce';

const optionalSpotId = z.preprocess(
  (v) => (v === undefined ? null : v),
  z.number().int().nullable()
);

const tolerantTimeOfDay = z.preprocess(
  (v) => (v === undefined || v === null ? '' : v),
  optionalTimeString
);

export const catchSchema = z.object({
  date: optionalDateString,
  timeOfDay: tolerantTimeOfDay,
  location: z.string().min(1, 'Location is required'),
  fjord: z.string(),
  bait: z.string().min(1, 'Bait is required'),
  lengthCm: coerceLengthCm,
  undersized: z.boolean(),
  notes: z.string(),
  spotId: optionalSpotId,
});

export type CatchFormData = z.infer<typeof catchSchema>;
