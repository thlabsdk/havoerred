import type { ProviderOutcome, WeatherLookup, WeatherReading } from './types';

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEZONE = 'Europe/Copenhagen';
const RECENT_DAY_THRESHOLD = 5;

const log = (msg: string, extra?: Record<string, unknown>) => {
  if (extra) console.log(`[weather-provider] ${msg}`, extra);
  else console.log(`[weather-provider] ${msg}`);
};

const logError = (msg: string, extra?: Record<string, unknown>) => {
  if (extra) console.error(`[weather-provider] ${msg}`, extra);
  else console.error(`[weather-provider] ${msg}`);
};

const daysBetween = (isoDate: string, today: Date): number => {
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  const ref = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((ref - target) / (1000 * 60 * 60 * 24));
};

const pickEndpoint = (isoDate: string): { base: string; source: string } => {
  const ageDays = daysBetween(isoDate, new Date());
  if (ageDays > RECENT_DAY_THRESHOLD) {
    return { base: ARCHIVE_BASE, source: 'open-meteo:archive' };
  }
  return { base: FORECAST_BASE, source: 'open-meteo:forecast' };
};

const buildUrl = (base: string, lookup: WeatherLookup): string => {
  const params = new URLSearchParams({
    latitude: lookup.latitude.toString(),
    longitude: lookup.longitude.toString(),
    start_date: lookup.isoDate,
    end_date: lookup.isoDate,
    hourly: 'temperature_2m,wind_speed_10m,weather_code',
    wind_speed_unit: 'ms',
    timezone: TIMEZONE,
  });
  return `${base}?${params.toString()}`;
};

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
  weather_code?: Array<number | null>;
};

type OpenMeteoResponse = {
  hourly?: OpenMeteoHourly;
  reason?: string;
  error?: boolean;
};

export async function fetchWeather(
  lookup: WeatherLookup
): Promise<ProviderOutcome<WeatherReading>> {
  const { base, source } = pickEndpoint(lookup.isoDate);
  const url = buildUrl(base, lookup);

  log('request', {
    endpoint: source,
    lat: lookup.latitude,
    lon: lookup.longitude,
    date: lookup.isoDate,
    hour: lookup.hour,
  });

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logError('network error', { message });
    return { ok: false, error: `network error: ${message}` };
  }

  if (!res.ok) {
    logError('http error', { status: res.status, statusText: res.statusText });
    return { ok: false, error: `HTTP ${res.status} from ${source}` };
  }

  let body: OpenMeteoResponse;
  try {
    body = (await res.json()) as OpenMeteoResponse;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logError('invalid JSON', { message });
    return { ok: false, error: `invalid JSON from ${source}` };
  }

  if (body.error) {
    return { ok: false, error: `provider error: ${body.reason ?? 'unknown'}` };
  }

  const hourly = body.hourly;
  if (!hourly?.time || hourly.time.length === 0) {
    return { ok: false, error: `no hourly data for ${lookup.isoDate}` };
  }

  const idx = lookup.hour;
  if (idx < 0 || idx >= hourly.time.length) {
    return { ok: false, error: `hour ${lookup.hour} out of range (got ${hourly.time.length} hours)` };
  }

  const temperature = hourly.temperature_2m?.[idx] ?? null;
  const windSpeed = hourly.wind_speed_10m?.[idx] ?? null;
  const codeRaw = hourly.weather_code?.[idx];
  const weatherCode = codeRaw === null || codeRaw === undefined ? null : String(codeRaw);

  const reading: WeatherReading = {
    weatherSource: source,
    weatherFetchedAt: new Date().toISOString(),
    windSpeedMs: windSpeed,
    airTemperatureC: temperature,
    weatherCode,
  };

  log('response', {
    pickedHour: hourly.time[idx],
    airTemperatureC: reading.airTemperatureC,
    windSpeedMs: reading.windSpeedMs,
    weatherCode: reading.weatherCode,
  });

  return { ok: true, data: reading };
}
