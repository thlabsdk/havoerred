import { describe, expect, it } from 'vitest';
import { mapCatchFromDb, toCatchInsertPayload, toCatchUpdatePayload } from './catch_mappers';
import type { CatchFromDB, CatchInsert, CatchUpdate } from '../types/catch';

const baseRow: CatchFromDB = {
  id: 1,
  date: '14/05/2026',
  time_of_day: '06:30',
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

  enrichment_status: 'enriched',
  enrichment_error: null,
  weather_source: 'open-meteo:archive:v1',
  weather_fetched_at: '2026-05-14T10:05:00Z',
  wind_speed_ms: 4.2,
  air_temperature_c: 8.1,
  weather_code: '61',
  water_source: 'open-meteo:marine:v1',
  water_fetched_at: '2026-05-14T10:05:00Z',
  water_level_trend: 'rising',
  tide_phase: 'high',
};

describe('mapCatchFromDb', () => {
  it('maps snake_case row to camelCase including time_of_day and enrichment fields', () => {
    expect(mapCatchFromDb(baseRow)).toEqual({
      id: 1,
      date: '14/05/2026',
      timeOfDay: '06:30',
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
      enrichmentStatus: 'enriched',
      enrichmentError: null,
      weatherSource: 'open-meteo:archive:v1',
      weatherFetchedAt: '2026-05-14T10:05:00Z',
      windSpeedMs: 4.2,
      airTemperatureC: 8.1,
      weatherCode: '61',
      waterSource: 'open-meteo:marine:v1',
      waterFetchedAt: '2026-05-14T10:05:00Z',
      waterLevelTrend: 'rising',
      tidePhase: 'high',
    });
  });

  it('converts null fjord to empty string', () => {
    const mapped = mapCatchFromDb({ ...baseRow, fjord: null });
    expect(mapped.fjord).toBe('');
  });

  it('forwards null wind_direction as null (enrichment-owned, nullable)', () => {
    const mapped = mapCatchFromDb({ ...baseRow, wind_direction: null });
    expect(mapped.windDirection).toBeNull();
  });

  it('preserves a non-null wind_direction string', () => {
    const mapped = mapCatchFromDb({ ...baseRow, wind_direction: 'SV' });
    expect(mapped.windDirection).toBe('SV');
  });

  it('converts null time_of_day to empty string', () => {
    expect(mapCatchFromDb({ ...baseRow, time_of_day: null }).timeOfDay).toBe('');
  });

  it('preserves null length_cm', () => {
    expect(mapCatchFromDb({ ...baseRow, length_cm: null }).lengthCm).toBeNull();
  });

  it('preserves null spot_id', () => {
    expect(mapCatchFromDb({ ...baseRow, spot_id: null }).spotId).toBeNull();
  });

  it('preserves null enrichment fields on a pending row', () => {
    const pending = mapCatchFromDb({
      ...baseRow,
      enrichment_status: 'pending',
      enrichment_error: null,
      weather_source: null,
      weather_fetched_at: null,
      wind_speed_ms: null,
      air_temperature_c: null,
      weather_code: null,
      water_source: null,
      water_fetched_at: null,
      water_level_trend: null,
      tide_phase: null,
    });
    expect(pending.enrichmentStatus).toBe('pending');
    expect(pending.weatherSource).toBeNull();
    expect(pending.windSpeedMs).toBeNull();
    expect(pending.airTemperatureC).toBeNull();
    expect(pending.weatherCode).toBeNull();
    expect(pending.waterSource).toBeNull();
    expect(pending.waterLevelTrend).toBeNull();
    expect(pending.tidePhase).toBeNull();
  });
});

describe('toCatchInsertPayload', () => {
  const baseInsert: CatchInsert = {
    date: '14/05/2026',
    timeOfDay: '06:30',
    location: 'Frederiksværk',
    fjord: 'Roskilde Fjord',
    bait: 'Mepps #3',
    lengthCm: 42,
    notes: 'overcast',
    spotId: 7,
  };

  it('converts empty fjord and timeOfDay to null', () => {
    const payload = toCatchInsertPayload({
      ...baseInsert,
      fjord: '',
      timeOfDay: '',
    });
    expect(payload.fjord).toBeNull();
    expect(payload.time_of_day).toBeNull();
  });

  it('snake_cases optional fields and omits wind_direction (enrichment-owned)', () => {
    const payload = toCatchInsertPayload(baseInsert) as Record<string, unknown>;
    expect(payload).toEqual({
      date: '14/05/2026',
      time_of_day: '06:30',
      location: 'Frederiksværk',
      fjord: 'Roskilde Fjord',
      bait: 'Mepps #3',
      length_cm: 42,
      undersized: false,
      notes: 'overcast',
      spot_id: 7,
    });
    expect(payload).not.toHaveProperty('wind_direction');
  });

  it('passes through null spotId', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, spotId: null });
    expect(payload.spot_id).toBeNull();
  });

  it('does NOT include enrichment fields (DB defaults take over)', () => {
    const payload = toCatchInsertPayload(baseInsert) as Record<string, unknown>;
    expect(payload).not.toHaveProperty('enrichment_status');
    expect(payload).not.toHaveProperty('weather_source');
    expect(payload).not.toHaveProperty('wind_speed_ms');
    expect(payload).not.toHaveProperty('wind_direction');
  });

  it('derives undersized=true when lengthCm is null', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, lengthCm: null });
    expect(payload.undersized).toBe(true);
  });

  it('derives undersized=true when lengthCm < 40', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, lengthCm: 39 });
    expect(payload.undersized).toBe(true);
  });

  it('derives undersized=false when lengthCm === 40', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, lengthCm: 40 });
    expect(payload.undersized).toBe(false);
  });

  it('derives undersized=false when lengthCm > 40', () => {
    const payload = toCatchInsertPayload({ ...baseInsert, lengthCm: 65 });
    expect(payload.undersized).toBe(false);
  });
});

describe('toCatchUpdatePayload', () => {
  it('returns an empty object when no fields are provided', () => {
    expect(toCatchUpdatePayload({} as CatchUpdate)).toEqual({});
  });

  it('only includes fields that are explicitly set', () => {
    expect(toCatchUpdatePayload({ location: 'Hundested' })).toEqual({ location: 'Hundested' });
  });

  it('derives undersized atomically when lengthCm is updated', () => {
    expect(toCatchUpdatePayload({ lengthCm: null })).toEqual({ length_cm: null, undersized: true });
    expect(toCatchUpdatePayload({ lengthCm: 39 })).toEqual({ length_cm: 39, undersized: true });
    expect(toCatchUpdatePayload({ lengthCm: 40 })).toEqual({ length_cm: 40, undersized: false });
    expect(toCatchUpdatePayload({ lengthCm: 65 })).toEqual({ length_cm: 65, undersized: false });
  });

  it('does not touch undersized when lengthCm is not in the update', () => {
    const payload = toCatchUpdatePayload({ notes: 'updated' });
    expect(payload).toEqual({ notes: 'updated' });
    expect(payload).not.toHaveProperty('undersized');
  });

  it('treats empty fjord/timeOfDay as null', () => {
    const payload = toCatchUpdatePayload({ fjord: '', timeOfDay: '' });
    expect(payload).toEqual({ fjord: null, time_of_day: null });
  });

  it('passes windDirection through as-is (null or cardinal string from enrichment)', () => {
    expect(toCatchUpdatePayload({ windDirection: 'SV' })).toEqual({ wind_direction: 'SV' });
    expect(toCatchUpdatePayload({ windDirection: null })).toEqual({ wind_direction: null });
  });

  it('passes through non-empty timeOfDay', () => {
    expect(toCatchUpdatePayload({ timeOfDay: '14:00' })).toEqual({ time_of_day: '14:00' });
  });

  it('includes explicit null spotId (unlink)', () => {
    expect(toCatchUpdatePayload({ spotId: null })).toEqual({ spot_id: null });
  });

  it('includes numeric spotId', () => {
    expect(toCatchUpdatePayload({ spotId: 42 })).toEqual({ spot_id: 42 });
  });

  it('includes a full enrichment patch', () => {
    const payload = toCatchUpdatePayload({
      enrichmentStatus: 'enriched',
      enrichmentError: null,
      weatherSource: 'open-meteo:archive:v1',
      weatherFetchedAt: '2026-05-14T10:05:00Z',
      windDirection: 'SV',
      windSpeedMs: 4.2,
      airTemperatureC: 8.1,
      weatherCode: '61',
      waterSource: 'open-meteo:marine:v1',
      waterFetchedAt: '2026-05-14T10:05:00Z',
      waterLevelTrend: 'rising',
      tidePhase: 'high',
    });
    expect(payload).toEqual({
      enrichment_status: 'enriched',
      enrichment_error: null,
      weather_source: 'open-meteo:archive:v1',
      weather_fetched_at: '2026-05-14T10:05:00Z',
      wind_direction: 'SV',
      wind_speed_ms: 4.2,
      air_temperature_c: 8.1,
      weather_code: '61',
      water_source: 'open-meteo:marine:v1',
      water_fetched_at: '2026-05-14T10:05:00Z',
      water_level_trend: 'rising',
      tide_phase: 'high',
    });
  });

  it('includes a water-only patch when weather is missing', () => {
    expect(
      toCatchUpdatePayload({
        waterSource: 'open-meteo:marine:v1',
        waterFetchedAt: '2026-05-14T10:05:00Z',
        waterLevelTrend: 'falling',
        tidePhase: null,
      })
    ).toEqual({
      water_source: 'open-meteo:marine:v1',
      water_fetched_at: '2026-05-14T10:05:00Z',
      water_level_trend: 'falling',
      tide_phase: null,
    });
  });

  it('includes a failed-status patch with error message', () => {
    expect(
      toCatchUpdatePayload({
        enrichmentStatus: 'failed',
        enrichmentError: 'HTTP 502 from open-meteo',
      })
    ).toEqual({
      enrichment_status: 'failed',
      enrichment_error: 'HTTP 502 from open-meteo',
    });
  });
});

describe('mapper round-trip', () => {
  it('mapCatchFromDb then toCatchInsertPayload preserves user-facing data and re-derives undersized', () => {
    const camel = mapCatchFromDb(baseRow);
    const insertable: CatchInsert = {
      date: camel.date,
      timeOfDay: camel.timeOfDay,
      location: camel.location,
      fjord: camel.fjord,
      bait: camel.bait,
      lengthCm: camel.lengthCm,
      notes: camel.notes,
      spotId: camel.spotId,
    };
    const payload = toCatchInsertPayload(insertable);
    expect(payload).toEqual({
      date: baseRow.date,
      time_of_day: baseRow.time_of_day,
      location: baseRow.location,
      fjord: baseRow.fjord,
      bait: baseRow.bait,
      length_cm: baseRow.length_cm,
      undersized: baseRow.undersized,
      notes: baseRow.notes,
      spot_id: baseRow.spot_id,
    });
  });
});
