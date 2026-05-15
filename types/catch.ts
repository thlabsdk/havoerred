export type EnrichmentStatus = 'pending' | 'enriched' | 'failed' | 'skipped';

export type Catch = {
  id: number;
  date: string;
  timeOfDay: string;
  location: string;
  fjord: string;
  bait: string;
  lengthCm: number | null;
  undersized: boolean;
  windDirection: string;
  notes: string;
  spotId: number | null;
  createdAt: string;
  updatedAt: string;

  enrichmentStatus: EnrichmentStatus;
  enrichmentError: string | null;
  weatherSource: string | null;
  weatherFetchedAt: string | null;
  windSpeedMs: number | null;
  airTemperatureC: number | null;
  weatherCode: string | null;
};

export type CatchFromDB = {
  id: number;
  date: string;
  time_of_day: string | null;
  location: string;
  fjord: string | null;
  bait: string;
  length_cm: number | null;
  undersized: boolean;
  wind_direction: string | null;
  notes: string;
  spot_id: number | null;
  created_at: string;
  updated_at: string;

  enrichment_status: EnrichmentStatus;
  enrichment_error: string | null;
  weather_source: string | null;
  weather_fetched_at: string | null;
  wind_speed_ms: number | null;
  air_temperature_c: number | null;
  weather_code: string | null;
};

type CatchOmitForInsert =
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'enrichmentStatus'
  | 'enrichmentError'
  | 'weatherSource'
  | 'weatherFetchedAt'
  | 'windSpeedMs'
  | 'airTemperatureC'
  | 'weatherCode';

export type CatchInsert = Omit<Catch, CatchOmitForInsert>;

export type CatchUpdate = Partial<CatchInsert> & Partial<EnrichmentPatch>;

export type CatchWithoutTimestamps = Omit<Catch, 'createdAt' | 'updatedAt'>;

export type EnrichmentPatch = {
  enrichmentStatus: EnrichmentStatus;
  enrichmentError: string | null;
  weatherSource: string | null;
  weatherFetchedAt: string | null;
  windSpeedMs: number | null;
  airTemperatureC: number | null;
  weatherCode: string | null;
};
