import { Catch, CatchFromDB, CatchInsert, CatchUpdate, TidePhase, WaterLevelTrend } from "../types/catch";

export function mapCatchFromDb(catchRow: CatchFromDB): Catch {
  return {
    id: catchRow.id,
    date: catchRow.date,
    timeOfDay: catchRow.time_of_day ?? '',
    location: catchRow.location,
    fjord: catchRow.fjord ?? '',
    bait: catchRow.bait,
    lengthCm: catchRow.length_cm,
    undersized: catchRow.undersized,
    windDirection: catchRow.wind_direction,
    notes: catchRow.notes,
    spotId: catchRow.spot_id ?? null,
    createdAt: catchRow.created_at,
    updatedAt: catchRow.updated_at,

    enrichmentStatus: catchRow.enrichment_status,
    enrichmentError: catchRow.enrichment_error,
    weatherSource: catchRow.weather_source,
    weatherFetchedAt: catchRow.weather_fetched_at,
    windSpeedMs: catchRow.wind_speed_ms,
    airTemperatureC: catchRow.air_temperature_c,
    weatherCode: catchRow.weather_code,
    waterSource: catchRow.water_source,
    waterFetchedAt: catchRow.water_fetched_at,
    waterLevelTrend: catchRow.water_level_trend as WaterLevelTrend | null,
    tidePhase: catchRow.tide_phase as TidePhase | null,
  };
}

export function toCatchInsertPayload(catchData: CatchInsert) {
  return {
    date: catchData.date,
    time_of_day: catchData.timeOfDay || null,
    location: catchData.location,
    fjord: catchData.fjord || null,
    bait: catchData.bait,
    length_cm: catchData.lengthCm,
    undersized: catchData.undersized,
    notes: catchData.notes,
    spot_id: catchData.spotId ?? null,
  };
}

export function toCatchUpdatePayload(catchData: CatchUpdate) {
  const payload: Record<string, unknown> = {};

  if (catchData.date !== undefined) {
    payload.date = catchData.date;
  }

  if (catchData.timeOfDay !== undefined) {
    payload.time_of_day = catchData.timeOfDay || null;
  }

  if (catchData.location !== undefined) {
    payload.location = catchData.location;
  }

  if (catchData.fjord !== undefined) {
    payload.fjord = catchData.fjord || null;
  }

  if (catchData.bait !== undefined) {
    payload.bait = catchData.bait;
  }

  if (catchData.lengthCm !== undefined) {
    payload.length_cm = catchData.lengthCm;
  }

  if (catchData.undersized !== undefined) {
    payload.undersized = catchData.undersized;
  }

  if (catchData.windDirection !== undefined) {
    payload.wind_direction = catchData.windDirection;
  }

  if (catchData.notes !== undefined) {
    payload.notes = catchData.notes;
  }

  if (catchData.spotId !== undefined) {
    payload.spot_id = catchData.spotId;
  }

  if (catchData.enrichmentStatus !== undefined) {
    payload.enrichment_status = catchData.enrichmentStatus;
  }

  if (catchData.enrichmentError !== undefined) {
    payload.enrichment_error = catchData.enrichmentError;
  }

  if (catchData.weatherSource !== undefined) {
    payload.weather_source = catchData.weatherSource;
  }

  if (catchData.weatherFetchedAt !== undefined) {
    payload.weather_fetched_at = catchData.weatherFetchedAt;
  }

  if (catchData.windSpeedMs !== undefined) {
    payload.wind_speed_ms = catchData.windSpeedMs;
  }

  if (catchData.airTemperatureC !== undefined) {
    payload.air_temperature_c = catchData.airTemperatureC;
  }

  if (catchData.weatherCode !== undefined) {
    payload.weather_code = catchData.weatherCode;
  }

  if (catchData.waterSource !== undefined) {
    payload.water_source = catchData.waterSource;
  }

  if (catchData.waterFetchedAt !== undefined) {
    payload.water_fetched_at = catchData.waterFetchedAt;
  }

  if (catchData.waterLevelTrend !== undefined) {
    payload.water_level_trend = catchData.waterLevelTrend;
  }

  if (catchData.tidePhase !== undefined) {
    payload.tide_phase = catchData.tidePhase;
  }

  return payload;
}
