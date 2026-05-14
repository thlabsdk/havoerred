import { describe, expect, it } from 'vitest';
import { spotSchema } from './spot-schema';

const validInput = {
  name: 'Frederiksværk Nordstrand',
  aliases: ['Fr-værk Nord'],
  bodyOfWater: 'Roskilde Fjord',
  latitude: 55.97,
  longitude: 12.02,
  region: 'Sjælland',
  notes: '',
};

describe('spotSchema', () => {
  it('accepts a typical spot', () => {
    const r = spotSchema.safeParse(validInput);
    expect(r.success).toBe(true);
  });

  it('rejects empty name', () => {
    const r = spotSchema.safeParse({ ...validInput, name: '' });
    expect(r.success).toBe(false);
  });

  it('defaults missing aliases to empty array (tolerant import)', () => {
    const { aliases: _omit, ...minimal } = validInput;
    void _omit;
    const r = spotSchema.safeParse(minimal);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aliases).toEqual([]);
  });

  it('defaults missing text fields to empty strings', () => {
    const r = spotSchema.safeParse({ name: 'Hundested' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bodyOfWater).toBe('');
      expect(r.data.region).toBe('');
      expect(r.data.notes).toBe('');
      expect(r.data.latitude).toBeNull();
      expect(r.data.longitude).toBeNull();
    }
  });

  it('treats empty-string lat/lng as null', () => {
    const r = spotSchema.safeParse({ name: 'X', latitude: '', longitude: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.latitude).toBeNull();
      expect(r.data.longitude).toBeNull();
    }
  });

  it('rejects non-numeric latitude', () => {
    const r = spotSchema.safeParse({ name: 'X', latitude: 'north' });
    expect(r.success).toBe(false);
  });

  it('rejects empty-string aliases', () => {
    const r = spotSchema.safeParse({ name: 'X', aliases: ['valid', ''] });
    expect(r.success).toBe(false);
  });

  it('accepts null aliases (tolerant)', () => {
    const r = spotSchema.safeParse({ name: 'X', aliases: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aliases).toEqual([]);
  });
});
