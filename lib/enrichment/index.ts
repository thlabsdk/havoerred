import { getSupabaseServer } from '../supabase/server';
import { mapCatchFromDb, toCatchUpdatePayload } from '../catch_mappers';
import type {
  Catch,
  CatchFromDB,
  EnrichmentPatch,
  EnrichmentStatus,
} from '../../types/catch';
import { fetchWeather } from './weather';
import { fetchWater } from './water';

export type EnrichResult = {
  status: EnrichmentStatus;
  catch: Catch;
};

const FALLBACK_HOUR = 12;
const DATE_PARTS = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const TIME_PARTS = /^(\d{2}):(\d{2})$/;

const tag = (catchId: number) => `[enrich-catch id=${catchId}]`;

const parseIsoDate = (ddmmyyyy: string): string | null => {
  const m = ddmmyyyy.match(DATE_PARTS);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

const parseHour = (hhmm: string): number => {
  const m = hhmm.match(TIME_PARTS);
  if (!m) return FALLBACK_HOUR;
  return parseInt(m[1], 10);
};

async function patchCatch(catchId: number, patch: Partial<EnrichmentPatch>): Promise<Catch> {
  const updatePayload = toCatchUpdatePayload(patch);
  const { data, error } = await getSupabaseServer()
    .from('catches')
    .update(updatePayload)
    .eq('id', catchId)
    .select()
    .single();

  if (error) {
    console.error(`${tag(catchId)} patch failed:`, error.message);
    throw new Error(`patch failed: ${error.message}`);
  }

  return mapCatchFromDb(data as CatchFromDB);
}

export async function enrichCatch(catchId: number): Promise<EnrichResult> {
  console.log(`${tag(catchId)} start`);

  const { data: catchRow, error: loadErr } = await getSupabaseServer()
    .from('catches')
    .select('*')
    .eq('id', catchId)
    .single();

  if (loadErr || !catchRow) {
    console.error(`${tag(catchId)} catch not found:`, loadErr?.message);
    throw new Error(`catch ${catchId} not found`);
  }

  const current = mapCatchFromDb(catchRow as CatchFromDB);

  if (current.enrichmentStatus === 'enriched') {
    console.log(`${tag(catchId)} already enriched, skipping provider call`);
    return { status: 'enriched', catch: current };
  }

  if (current.spotId === null) {
    console.log(`${tag(catchId)} no spot_id, marking skipped`);
    const patched = await patchCatch(catchId, {
      enrichmentStatus: 'skipped',
      enrichmentError: 'no spot linked to catch',
    });
    return { status: 'skipped', catch: patched };
  }

  const { data: spotRow, error: spotErr } = await getSupabaseServer()
    .from('spots')
    .select('latitude, longitude')
    .eq('id', current.spotId)
    .single();

  if (spotErr || !spotRow) {
    console.error(`${tag(catchId)} spot lookup failed:`, spotErr?.message);
    const patched = await patchCatch(catchId, {
      enrichmentStatus: 'skipped',
      enrichmentError: 'spot not found',
    });
    return { status: 'skipped', catch: patched };
  }

  const { latitude, longitude } = spotRow as { latitude: number | null; longitude: number | null };

  if (latitude === null || longitude === null) {
    console.log(`${tag(catchId)} spot has no coordinates, marking skipped`);
    const patched = await patchCatch(catchId, {
      enrichmentStatus: 'skipped',
      enrichmentError: 'spot missing coordinates',
    });
    return { status: 'skipped', catch: patched };
  }

  const isoDate = parseIsoDate(current.date);
  if (!isoDate) {
    console.error(`${tag(catchId)} unparseable date:`, current.date);
    const patched = await patchCatch(catchId, {
      enrichmentStatus: 'failed',
      enrichmentError: `unparseable date "${current.date}"`,
    });
    return { status: 'failed', catch: patched };
  }

  const hour = current.timeOfDay ? parseHour(current.timeOfDay) : FALLBACK_HOUR;
  const lookup = { latitude, longitude, isoDate, hour };

  // Providers are independent, IO-bound, no shared mutable state — run in
  // parallel to reduce enrichment latency. Each returns ProviderOutcome and
  // never throws, so isolation semantics are preserved.
  const [weatherOutcome, waterOutcome] = await Promise.all([
    fetchWeather(lookup),
    fetchWater(lookup),
  ]);

  const patch: Partial<EnrichmentPatch> = {};

  if (weatherOutcome.ok) {
    const r = weatherOutcome.data;
    patch.weatherSource = r.weatherSource;
    patch.weatherFetchedAt = r.weatherFetchedAt;
    patch.windDirection = r.windDirection;
    patch.windSpeedMs = r.windSpeedMs;
    patch.airTemperatureC = r.airTemperatureC;
    patch.weatherCode = r.weatherCode;
  }

  if (waterOutcome.ok) {
    const r = waterOutcome.data;
    patch.waterSource = r.waterSource;
    patch.waterFetchedAt = r.waterFetchedAt;
    patch.waterLevelTrend = r.waterLevelTrend;
    patch.tidePhase = r.tidePhase;
  }

  const anyOk = weatherOutcome.ok || waterOutcome.ok;
  patch.enrichmentStatus = anyOk ? 'enriched' : 'failed';
  patch.enrichmentError = anyOk
    ? null
    : `${weatherOutcome.ok ? '' : weatherOutcome.error} | ${waterOutcome.ok ? '' : waterOutcome.error}`;

  const patched = await patchCatch(catchId, patch);

  console.log(`${tag(catchId)} done`, {
    weather: weatherOutcome.ok ? 'ok' : weatherOutcome.error,
    water: waterOutcome.ok ? 'ok' : waterOutcome.error,
  });

  return { status: patch.enrichmentStatus, catch: patched };
}
