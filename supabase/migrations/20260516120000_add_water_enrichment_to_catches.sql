alter table catches
  add column water_source text,
  add column water_fetched_at timestamp with time zone,
  add column water_level_trend text,
  add column tide_phase text;
