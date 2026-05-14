import { Catch, CatchFromDB, CatchInsert, CatchUpdate } from "../types/catch";

export function mapCatchFromDb(catchRow: CatchFromDB): Catch {
  return {
    id: catchRow.id,
    date: catchRow.date,
    location: catchRow.location,
    fjord: catchRow.fjord ?? '',
    bait: catchRow.bait,
    lengthCm: catchRow.length_cm,
    undersized: catchRow.undersized,
    windDirection: catchRow.wind_direction ?? '',
    notes: catchRow.notes,
    spotId: catchRow.spot_id ?? null,
    createdAt: catchRow.created_at,
    updatedAt: catchRow.updated_at,
  };
}

export function toCatchInsertPayload(catchData: CatchInsert) {
  return {
    date: catchData.date,
    location: catchData.location,
    fjord: catchData.fjord || null,
    bait: catchData.bait,
    length_cm: catchData.lengthCm,
    undersized: catchData.undersized,
    wind_direction: catchData.windDirection || null,
    notes: catchData.notes,
    spot_id: catchData.spotId ?? null,
  };
}

export function toCatchUpdatePayload(catchData: CatchUpdate) {
  const payload: Record<string, unknown> = {};

  if (catchData.date !== undefined) {
    payload.date = catchData.date;
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
    payload.wind_direction = catchData.windDirection || null;
  }

  if (catchData.notes !== undefined) {
    payload.notes = catchData.notes;
  }

  if (catchData.spotId !== undefined) {
    payload.spot_id = catchData.spotId;
  }

  return payload;
}
