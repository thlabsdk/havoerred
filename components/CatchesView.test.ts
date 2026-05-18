import { describe, it, expect } from 'vitest';
import { deriveFjord } from './CatchesView';
import type { Spot } from '../types/spot';

const SPOTS: Spot[] = [
  {
    id: 1,
    name: 'Kyndby',
    aliases: [],
    bodyOfWater: 'Roskilde Fjord',
    latitude: null,
    longitude: null,
    region: 'Sjælland',
    notes: '',
    ownerUserId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Frederikssund',
    aliases: [],
    bodyOfWater: '',
    latitude: null,
    longitude: null,
    region: 'Sjælland',
    notes: '',
    ownerUserId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('deriveFjord', () => {
  it('returns empty string when spotId is null', () => {
    expect(deriveFjord(SPOTS, null)).toBe('');
  });

  it('returns spot bodyOfWater when spot is found', () => {
    expect(deriveFjord(SPOTS, 1)).toBe('Roskilde Fjord');
  });

  it('returns empty string when spot has no bodyOfWater', () => {
    expect(deriveFjord(SPOTS, 2)).toBe('');
  });

  it('returns empty string when spotId is not in the spots list', () => {
    expect(deriveFjord(SPOTS, 999)).toBe('');
  });
});
