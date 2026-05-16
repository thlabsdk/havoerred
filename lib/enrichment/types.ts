import type { TidePhase, WaterLevelTrend } from '../../types/catch';

export type WeatherReading = {
  weatherSource: string;
  weatherFetchedAt: string;
  windDirection: string | null;
  windSpeedMs: number | null;
  airTemperatureC: number | null;
  weatherCode: string | null;
};

export type WaterReading = {
  waterSource: string;
  waterFetchedAt: string;
  waterLevelTrend: WaterLevelTrend | null;
  tidePhase: TidePhase | null;
};

export type ProviderOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type WeatherLookup = {
  latitude: number;
  longitude: number;
  isoDate: string;
  hour: number;
};
