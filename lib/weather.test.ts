import { describe, expect, it } from 'vitest';
import { degreeToCardinal } from './weather';

describe('degreeToCardinal', () => {
  it('maps the eight canonical bearings', () => {
    expect(degreeToCardinal(0)).toBe('N');
    expect(degreeToCardinal(45)).toBe('NØ');
    expect(degreeToCardinal(90)).toBe('Ø');
    expect(degreeToCardinal(135)).toBe('SØ');
    expect(degreeToCardinal(180)).toBe('S');
    expect(degreeToCardinal(225)).toBe('SV');
    expect(degreeToCardinal(270)).toBe('V');
    expect(degreeToCardinal(315)).toBe('NV');
  });

  it('wraps values outside [0, 360)', () => {
    expect(degreeToCardinal(360)).toBe('N');
    expect(degreeToCardinal(405)).toBe('NØ');
    expect(degreeToCardinal(-45)).toBe('NV');
    expect(degreeToCardinal(720)).toBe('N');
  });

  it('rounds to the nearest 45° bucket', () => {
    expect(degreeToCardinal(22)).toBe('N');
    expect(degreeToCardinal(23)).toBe('NØ');
    expect(degreeToCardinal(67)).toBe('NØ');
    expect(degreeToCardinal(68)).toBe('Ø');
  });

  it('returns null for nullish or non-finite input', () => {
    expect(degreeToCardinal(null)).toBeNull();
    expect(degreeToCardinal(undefined)).toBeNull();
    expect(degreeToCardinal(Number.NaN)).toBeNull();
    expect(degreeToCardinal(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
