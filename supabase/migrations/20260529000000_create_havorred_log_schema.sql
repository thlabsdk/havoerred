-- Migration: create havorred_log schema in Personal OS Supabase project
-- Target: personal-os-dev (ibnipeewahvmucjamsku)
-- Applied via: Supabase MCP apply_migration

-- ============================================================
-- Schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS havorred_log;

-- ============================================================
-- spots
-- ============================================================
CREATE TABLE havorred_log.spots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  body_of_water text,
  latitude double precision,
  longitude double precision,
  region text,
  notes text,
  owner_user_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Same (owner, name) cannot repeat. NULLS NOT DISTINCT treats two NULL owners as equal,
-- which is correct for the single-user phase.
ALTER TABLE havorred_log.spots
  ADD CONSTRAINT spots_owner_name_unique
  UNIQUE NULLS NOT DISTINCT (owner_user_id, name);

CREATE INDEX spots_body_of_water_idx ON havorred_log.spots (body_of_water);
CREATE INDEX spots_owner_idx         ON havorred_log.spots (owner_user_id);

-- ============================================================
-- catches
-- ============================================================
CREATE TABLE havorred_log.catches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date text NOT NULL,
  location text NOT NULL,
  fjord text,
  bait text NOT NULL,
  length_cm integer,
  undersized boolean DEFAULT false,
  wind_direction text,
  notes text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  spot_id bigint REFERENCES havorred_log.spots(id) ON DELETE SET NULL,
  time_of_day text,
  enrichment_status text NOT NULL DEFAULT 'pending',
  enrichment_error text,
  weather_source text,
  weather_fetched_at timestamp with time zone,
  wind_speed_ms numeric,
  air_temperature_c numeric,
  weather_code text,
  water_source text,
  water_fetched_at timestamp with time zone,
  water_level_trend text,
  tide_phase text
);

CREATE INDEX catches_spot_id_idx          ON havorred_log.catches (spot_id);
CREATE INDEX catches_enrichment_status_idx ON havorred_log.catches (enrichment_status);

-- ============================================================
-- catch_analytics_view
-- security_invoker = true (Postgres 15+): view runs with caller's permissions,
-- so the underlying table RLS policies apply.
-- ============================================================
CREATE VIEW havorred_log.catch_analytics_view
  WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.date,
  to_date(c.date, 'DD/MM/YYYY')                                       AS catch_date,
  c.location,
  c.fjord,
  c.bait,
  c.length_cm,
  c.undersized,
  c.enrichment_status,
  c.spot_id,
  s.name                                                               AS spot_name,
  s.body_of_water                                                      AS spot_body_of_water,
  s.region                                                             AS spot_region,
  s.latitude                                                           AS spot_latitude,
  s.longitude                                                          AS spot_longitude,
  c.time_of_day,
  c.wind_direction,
  c.wind_speed_ms,
  c.air_temperature_c,
  c.weather_code,
  c.water_level_trend,
  c.tide_phase,
  extract(year  FROM to_date(c.date, 'DD/MM/YYYY'))::integer           AS catch_year,
  extract(month FROM to_date(c.date, 'DD/MM/YYYY'))::integer           AS catch_month,
  CASE extract(month FROM to_date(c.date, 'DD/MM/YYYY'))
    WHEN 3 THEN 'spring' WHEN 4 THEN 'spring' WHEN 5 THEN 'spring'
    WHEN 6 THEN 'summer' WHEN 7 THEN 'summer' WHEN 8 THEN 'summer'
    WHEN 9 THEN 'autumn' WHEN 10 THEN 'autumn' WHEN 11 THEN 'autumn'
    ELSE 'winter'
  END                                                                  AS season,
  CASE
    WHEN c.time_of_day IS NULL THEN NULL
    WHEN split_part(c.time_of_day, ':', 1)::integer BETWEEN 6  AND 11 THEN 'morning'
    WHEN split_part(c.time_of_day, ':', 1)::integer BETWEEN 12 AND 17 THEN 'day'
    WHEN split_part(c.time_of_day, ':', 1)::integer BETWEEN 18 AND 23 THEN 'evening'
    ELSE 'night'
  END                                                                  AS time_bucket,
  c.wind_direction                                                     AS wind_sector,
  CASE
    WHEN c.length_cm IS NULL OR c.length_cm < 40  THEN 'undersized'
    WHEN c.length_cm BETWEEN 40 AND 54            THEN '40-54'
    WHEN c.length_cm BETWEEN 55 AND 64            THEN '55-64'
    ELSE                                               '65+'
  END                                                                  AS catch_size_bucket,
  c.water_level_trend                                                  AS water_trend_label,
  c.created_at
FROM havorred_log.catches c
LEFT JOIN havorred_log.spots s ON s.id = c.spot_id;

-- ============================================================
-- RLS
-- Note: uses TO authenticated (not deprecated auth.role()).
-- Single-user system — any authenticated session can access all rows.
-- ============================================================
ALTER TABLE havorred_log.catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE havorred_log.spots   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catches_select" ON havorred_log.catches FOR SELECT TO authenticated USING (true);
CREATE POLICY "catches_insert" ON havorred_log.catches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "catches_update" ON havorred_log.catches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "catches_delete" ON havorred_log.catches FOR DELETE TO authenticated USING (true);

CREATE POLICY "spots_select"   ON havorred_log.spots FOR SELECT TO authenticated USING (true);
CREATE POLICY "spots_insert"   ON havorred_log.spots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "spots_update"   ON havorred_log.spots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "spots_delete"   ON havorred_log.spots FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Grants
-- anon role intentionally excluded: app requires authentication
-- (proxy.ts redirects all unauthenticated requests to /login).
-- ============================================================
GRANT USAGE ON SCHEMA havorred_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON havorred_log.catches              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON havorred_log.spots                TO authenticated;
GRANT SELECT                         ON havorred_log.catch_analytics_view TO authenticated;
