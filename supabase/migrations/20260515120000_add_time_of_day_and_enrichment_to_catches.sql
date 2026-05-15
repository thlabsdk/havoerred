alter table catches
  add column time_of_day text,

  add column enrichment_status text not null default 'pending',
  add column enrichment_error text,

  add column weather_source text,
  add column weather_fetched_at timestamp with time zone,

  add column wind_speed_ms numeric,
  add column air_temperature_c numeric,
  add column weather_code text;

create index catches_enrichment_status_idx on catches (enrichment_status);
