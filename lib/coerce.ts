import { z } from 'zod';

export const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const optionalDateString = z
  .string()
  .refine((val) => val === '' || DATE_REGEX.test(val), {
    message: 'date must be empty or dd/mm/yyyy',
  });

export const optionalTimeString = z
  .string()
  .refine((val) => val === '' || TIME_OF_DAY_REGEX.test(val), {
    message: 'time must be empty or HH:mm (24h)',
  });

export const coerceLengthCm = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number().nullable());
