import { z } from 'zod';

const aliasArray = z.preprocess(
  (v) => (v === undefined || v === null ? [] : v),
  z.array(z.string().min(1))
);

const optionalCoord = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.number().nullable()
);

export const spotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  aliases: aliasArray,
  bodyOfWater: z.string().default(''),
  latitude: optionalCoord,
  longitude: optionalCoord,
  region: z.string().default(''),
  notes: z.string().default(''),
});

export type SpotFormData = z.infer<typeof spotSchema>;
