export type WeatherReading = {
  weatherSource: string;
  weatherFetchedAt: string;
  windSpeedMs: number | null;
  airTemperatureC: number | null;
  weatherCode: string | null;
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
