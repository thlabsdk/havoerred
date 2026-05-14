import { describe, expect, it } from 'vitest';
import { mapCatchFromDb, toCatchInsertPayload, toCatchUpdatePayload } from './catch_mappers';
import type { CatchFromDB, CatchInsert, CatchUpdate } from '../types/catch';

const baseRow: CatchFromDB = {
  id: 1,
  date: '14/05/2026',
  location: 'Frederiksværk Nordstrand',
  fjord: 'Roskilde Fjord',
  bait: 'Mepps #3',
  length_cm: 42,
  undersized: false,
  wind_direction: 'NW',
  notes: 'overcast',
  spot_id: 7,
  created_at: '2026-05-14T10:00:00Z',
  updated_at: '2026-05-14T10:00:00Z',
};

describe('mapCatchFromDb', () => {
  it('maps snake_case row to camelCase including spotId', () => {
    expect(mapCatchFromDb(baseRow)).toEqual({
      id: 1,
      date: '14/05/2026',
      location: 'Frederiksværk Nordstrand',
      fjord: 'Roskilde Fjord',
      bait: 'Mepps #3',
      lengthCm: 42,
      undersized: false,
      windDirection: 'NW',
      notes: 'overcast',
      spotId: 7,
      createdAt: '2026-05-14T10:00:00Z',
      updatedAt: '2026-05-14T10:00:00Z',
    });
  });

  it('converts null fjord and wind_direction to empty strings', () => {
    const mapped = mapCatchFromDb({ ...baseRow, fjord: null, wind_direction: null });
    expect(mapped.fjord).toBe('');
    expect(mapped.windDirection).toBe('');
  });

  it('preserves null length_cm', () => {
    expect(mapCatchFromDb({ ...baseRow, length_cm: null }).lengthCm).toBeNull();
  });

  it('preserves null spot_id', () => {
    expect(mapCatchFromDb({ ...baseRow, spot_id: null }).spotId).toBeNull();
  });
});

describe('toCatchInsertPayload', () => {
  const baseInsert: CatchInsert = {
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

  it('converts empty fjord and windDirection to null', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, fjord: '', windDirection: '' });
    expect(payload.fjord).toBeNull();
    expect(payload.wind_direction).toBeNull();
  });

  it('preserves non-empty optional fields and snake_cases length + spot', () => {
    const payload = toCatchInsertPayload(baseInsert);
    expect(payload).toEqual({
      date: '14/05/2026',
      location: 'Frederiksværk',
      fjord: 'Roskilde Fjord',
      bait: 'Mepps #3',
      length_cm: 42,
      undersized: false,
      wind_direction: 'NW',
      notes: 'overcast',
      spot_id: 7,
    });
  });

  it('passes through null spotId', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, spotId: null });
    expect(payload.spot_id).toBeNull();
  });
});

describe('toCatchUpdatePayload', () => {
  it('returns an empty object when no fields are provided', () => {
    expect(toCatchUpdatePayload({} as CatchUpdate)).toEqual({});
  });

  it('only includes fields that are explicitly set', () => {
    expect(toCatchUpdatePayload({ location: 'Hundested' })).toEqual({ location: 'Hundested' });
  });

  it('preserves explicit null lengthCm and false undersized', () => {
    const payload = toCatchUpdatePayload({ lengthCm: null, undersized: false });
    expect(payload).toEqual({ length_cm: null, undersized: false });
  });

  it('treats empty fjord/windDirection as null', () => {
    const payload = toCatchUpdatePayload({ fjord: '', windDirection: '' });
    expect(payload).toEqual({ fjord: null, wind_direction: null });
  });

  it('includes explicit null spotId (unlink)', () => {
    expect(toCatchUpdatePayload({ spotId: null })).toEqual({ spot_id: null });
  });

  it('includes numeric spotId', () => {
    expect(toCatchUpdatePayload({ spotId: 42 })).toEqual({ spot_id: 42 });
  });
});

describe('mapper round-trip', () => {
  it('mapCatchFromDb then toCatchInsertPayload preserves user-facing data', () => {
    const camel = mapCatchFromDb(baseRow);
    const insertable: CatchInsert = {
      date: camel.date,
      location: camel.location,
      fjord: camel.fjord,
      bait: camel.bait,
      lengthCm: camel.lengthCm,
      undersized: camel.undersized,
      windDirection: camel.windDirection,
      notes: camel.notes,
      spotId: camel.spotId,
    };
    const payload = toCatchInsertPayload(insertable);
    expect(payload).toEqual({
      date: baseRow.date,
      location: baseRow.location,
      fjord: baseRow.fjord,
      bait: baseRow.bait,
      length_cm: baseRow.length_cm,
      undersized: baseRow.undersized,
      wind_direction: baseRow.wind_direction,
      notes: baseRow.notes,
      spot_id: baseRow.spot_id,
    });
  });
});
