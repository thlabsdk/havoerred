import type { ProviderOutcome, WaterReading, WeatherLookup } from './types';
import type { TidePhase, WaterLevelTrend } from '../../types/catch';

const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';
const SOURCE = 'open-meteo:marine:v1';
const TIMEZONE = 'Europe/Copenhagen';
const WATER_TREND_THRESHOLD_METERS = 0.02;

const log = (msg: string, extra?: Record<string, unknown>) => {
  if (extra) console.log(`[water-provider] ${msg}`, extra);
  else console.log(`[water-provider] ${msg}`);
};

const logError = (msg: string, extra?: Record<string, unknown>) => {
  if (extra) console.error(`[water-provider] ${msg}`, extra);
  else console.error(`[water-provider] ${msg}`);
};

const buildUrl = (lookup: WeatherLookup): string => {
  const params = new URLSearchParams({
    latitude: lookup.latitude.toString(),
    longitude: lookup.longitude.toString(),
    start_date: lookup.isoDate,
    end_date: lookup.isoDate,
    hourly: 'sea_level_height_msl',
    timezone: TIMEZONE,
  });
  return `${MARINE_BASE}?${params.toString()}`;
};

type MarineHourly = {
  time?: string[];
  sea_level_height_msl?: Array<number | null>;
};

type MarineResponse = {
  hourly?: MarineHourly;
  reason?: string;
  error?: boolean;
};

const deriveTrend = (
  levels: Array<number | null>,
  hour: number
): WaterLevelTrend | null => {
  const refIdx = hour > 0 ? hour - 1 : hour;
  const cmpIdx = hour > 0 ? hour : hour + 1;

  if (cmpIdx >= levels.length) return null;

  const ref = levels[refIdx];
  const cmp = levels[cmpIdx];
  if (ref === null || ref === undefined || cmp === null || cmp === undefined) {
    return null;
  }

  const delta = cmp - ref;
  if (delta > WATER_TREND_THRESHOLD_METERS) return 'rising';
  if (delta < -WATER_TREND_THRESHOLD_METERS) return 'falling';
  return 'stable';
};

// Lightweight derived heuristic — NOT an authoritative tide calculation.
// We just check whether the catch hour is a local max/min within a ±2h window.
// Intended only as a low-cost contextual signal for Phase 3B; a future DMI
// integration would replace this with proper tide-table data.
const deriveTidePhase = (
  levels: Array<number | null>,
  hour: number
): TidePhase | null => {
  const start = Math.max(0, hour - 2);
  const end = Math.min(levels.length - 1, hour + 2);
  if (end - start < 2) return null;

  const here = levels[hour];
  if (here === null || here === undefined) return null;

  let isMax = true;
  let isMin = true;
  for (let i = start; i <= end; i++) {
    if (i === hour) continue;
    const v = levels[i];
    if (v === null || v === undefined) return null;
    if (v > here) isMax = false;
    if (v < here) isMin = false;
  }

  if (isMax && !isMin) return 'high';
  if (isMin && !isMax) return 'low';
  return null;
};

export async function fetchWater(
  lookup: WeatherLookup
): Promise<ProviderOutcome<WaterReading>> {
  const url = buildUrl(lookup);

  log('request', {
    endpoint: SOURCE,
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
    return { ok: false, error: `HTTP ${res.status} from ${SOURCE}` };
  }

  let body: MarineResponse;
  try {
    body = (await res.json()) as MarineResponse;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logError('invalid JSON', { message });
    return { ok: false, error: `invalid JSON from ${SOURCE}` };
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

  const levels = hourly.sea_level_height_msl ?? [];
  const waterLevelTrend = deriveTrend(levels, idx);
  const tidePhase = deriveTidePhase(levels, idx);

  const reading: WaterReading = {
    waterSource: SOURCE,
    waterFetchedAt: new Date().toISOString(),
    waterLevelTrend,
    tidePhase,
  };

  log('response', {
    pickedHour: hourly.time[idx],
    seaLevelHere: levels[idx] ?? null,
    waterLevelTrend,
    tidePhase,
  });

  return { ok: true, data: reading };
}
