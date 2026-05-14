export type Catch = {
  id: number;
  date: string;
  location: string;
  fjord: string;
  bait: string;
  lengthCm: number | null;
  undersized: boolean;
  windDirection: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CatchFromDB = {
  id: number;
  date: string;
  location: string;
  fjord: string | null;
  bait: string;
  length_cm: number | null;
  undersized: boolean;
  wind_direction: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CatchInsert = Omit<Catch, 'id' | 'createdAt' | 'updatedAt'>;

export type CatchUpdate = Partial<CatchInsert>;

export type CatchWithoutTimestamps = Omit<Catch, 'createdAt' | 'updatedAt'>;

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

  return payload;
}
