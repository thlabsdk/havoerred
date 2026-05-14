import { describe, expect, it } from 'vitest';
import { mapSpotFromDb, toSpotInsertPayload } from './spot_mappers';
import type { SpotFromDB, SpotInsert } from '../types/spot';

const baseRow: SpotFromDB = {
  id: 1,
  name: 'Frederiksværk Nordstrand',
  aliases: ['Fr-værk Nord', 'Frederiksværk N'],
  body_of_water: 'Roskilde Fjord',
  latitude: 55.97,
  longitude: 12.02,
  region: 'Sjælland',
  notes: 'godt om morgenen',
  owner_user_id: null,
  created_at: '2026-05-14T10:00:00Z',
  updated_at: '2026-05-14T10:00:00Z',
};

describe('mapSpotFromDb', () => {
  it('maps snake_case row to camelCase', () => {
    expect(mapSpotFromDb(baseRow)).toEqual({
      id: 1,
      name: 'Frederiksværk Nordstrand',
      aliases: ['Fr-værk Nord', 'Frederiksværk N'],
      bodyOfWater: 'Roskilde Fjord',
      latitude: 55.97,
      longitude: 12.02,
      region: 'Sjælland',
      notes: 'godt om morgenen',
      ownerUserId: null,
      createdAt: '2026-05-14T10:00:00Z',
      updatedAt: '2026-05-14T10:00:00Z',
    });
  });

  it('coerces null aliases to empty array', () => {
    expect(mapSpotFromDb({ ...baseRow, aliases: null }).aliases).toEqual([]);
  });

  it('coerces null text fields to empty strings', () => {
    const mapped = mapSpotFromDb({
      ...baseRow,
      body_of_water: null,
      region: null,
      notes: null,
    });
    expect(mapped.bodyOfWater).toBe('');
    expect(mapped.region).toBe('');
    expect(mapped.notes).toBe('');
  });

  it('preserves null lat/lng', () => {
    const mapped = mapSpotFromDb({ ...baseRow, latitude: null, longitude: null });
    expect(mapped.latitude).toBeNull();
    expect(mapped.longitude).toBeNull();
  });
});

describe('toSpotInsertPayload', () => {
  const baseInsert: SpotInsert = {
    name: 'Hundested Mole',
    aliases: ['Hundested H'],
    bodyOfWater: 'Kattegat',
    latitude: 56.0,
    longitude: 11.85,
    region: 'Sjælland',
    notes: '',
  };

  it('preserves data and snake_cases bodyOfWater', () => {
    expect(toSpotInsertPayload(baseInsert)).toEqual({
      name: 'Hundested Mole',
      aliases: ['Hundested H'],
      body_of_water: 'Kattegat',
      latitude: 56.0,
      longitude: 11.85,
      region: 'Sjælland',
      notes: null,
    });
  });

  it('nulls empty bodyOfWater and region', () => {
    const payload = toSpotInsertPayload({ ...baseInsert, bodyOfWater: '', region: '' });
    expect(payload.body_of_water).toBeNull();
    expect(payload.region).toBeNull();
  });
});

describe('spot round-trip', () => {
  it('mapSpotFromDb then toSpotInsertPayload preserves user-facing data', () => {
    const camel = mapSpotFromDb(baseRow);
    const insertable: SpotInsert = {
      name: camel.name,
      aliases: camel.aliases,
      bodyOfWater: camel.bodyOfWater,
      latitude: camel.latitude,
      longitude: camel.longitude,
      region: camel.region,
      notes: camel.notes,
    };
    expect(toSpotInsertPayload(insertable)).toEqual({
      name: baseRow.name,
      aliases: baseRow.aliases,
      body_of_water: baseRow.body_of_water,
      latitude: baseRow.latitude,
      longitude: baseRow.longitude,
      region: baseRow.region,
      notes: baseRow.notes,
    });
  });
});
