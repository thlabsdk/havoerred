import { describe, expect, it } from 'vitest';
import { catchSchema } from './catch-schema';

const validInput = {
  date: '14/05/2026',
  location: 'Frederiksværk',
  fjord: 'Roskilde Fjord',
  bait: 'Mepps #3',
  lengthCm: 42,
  undersized: false,
  windDirection: 'NW',
  notes: 'overcast',
  spotId: 7,
};

describe('catchSchema', () => {
  it('accepts a typical AI-shaped catch', () => {
    const r = catchSchema.safeParse(validInput);
    expect(r.success).toBe(true);
  });

  it('accepts empty date', () => {
    const r = catchSchema.safeParse({ ...validInput, date: '' });
    expect(r.success).toBe(true);
  });

  it('rejects malformed date', () => {
    const r = catchSchema.safeParse({ ...validInput, date: '2026-05-14' });
    expect(r.success).toBe(false);
  });

  it('rejects empty location', () => {
    const r = catchSchema.safeParse({ ...validInput, location: '' });
    expect(r.success).toBe(false);
  });

  it('rejects empty bait', () => {
    const r = catchSchema.safeParse({ ...validInput, bait: '' });
    expect(r.success).toBe(false);
  });

  it('accepts empty fjord and windDirection (text fields can be blank)', () => {
    const r = catchSchema.safeParse({ ...validInput, fjord: '', windDirection: '' });
    expect(r.success).toBe(true);
  });

  it('coerces "45" string to numeric lengthCm', () => {
    const r = catchSchema.safeParse({ ...validInput, lengthCm: '45' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lengthCm).toBe(45);
  });

  it('coerces "45 cm" string to numeric lengthCm', () => {
    const r = catchSchema.safeParse({ ...validInput, lengthCm: '45 cm' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lengthCm).toBe(45);
  });

  it('accepts null lengthCm', () => {
    const r = catchSchema.safeParse({ ...validInput, lengthCm: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lengthCm).toBeNull();
  });

  it('treats empty-string lengthCm as null', () => {
    const r = catchSchema.safeParse({ ...validInput, lengthCm: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lengthCm).toBeNull();
  });

  it('rejects non-boolean undersized', () => {
    const r = catchSchema.safeParse({ ...validInput, undersized: 'no' });
    expect(r.success).toBe(false);
  });

  it('accepts null spotId', () => {
    const r = catchSchema.safeParse({ ...validInput, spotId: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBeNull();
  });

  it('accepts numeric spotId', () => {
    const r = catchSchema.safeParse({ ...validInput, spotId: 12 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBe(12);
  });

  it('treats missing spotId as null (legacy JSON imports)', () => {
    const { spotId: _omit, ...legacy } = validInput;
    void _omit;
    const r = catchSchema.safeParse(legacy);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spotId).toBeNull();
  });

  it('rejects non-integer spotId', () => {
    const r = catchSchema.safeParse({ ...validInput, spotId: 3.14 });
    expect(r.success).toBe(false);
  });
});
