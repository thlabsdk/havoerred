-- catch_analytics_view: analytics-ready join of catches + spots.
--
-- Transitional compatibility note:
--   'date' is stored as TEXT (DD/MM/YYYY) and 'time_of_day' as TEXT (HH:MM).
--   to_date() and split_part() below are a parsing layer, not permanent design.
--   Future migrations will convert:
--     catches.date        TEXT  → DATE
--     catches.time_of_day TEXT  → TIME
--   When that happens, remove the parsing expressions from this view and reference
--   the columns directly.

create view catch_analytics_view as
select
  -- Core catch fields
  c.id,
  c.date,
  to_date(c.date, 'DD/MM/YYYY')                                    as catch_date,
  c.location,
  c.fjord,
  c.bait,
  c.length_cm,
  c.undersized,
  c.enrichment_status,

  -- Spot (null-safe: left join; all spot_* columns are null when spot_id is null)
  c.spot_id,
  s.name                                                            as spot_name,
  s.body_of_water                                                   as spot_body_of_water,
  s.region                                                          as spot_region,
  s.latitude                                                        as spot_latitude,
  s.longitude                                                       as spot_longitude,

  -- Weather raw
  c.time_of_day,
  c.wind_direction,
  c.wind_speed_ms,
  c.air_temperature_c,
  c.weather_code,

  -- Water raw
  c.water_level_trend,
  c.tide_phase,

  -- Derived: time aggregation helpers (always non-null — catches.date is NOT NULL)
  extract(year  from to_date(c.date, 'DD/MM/YYYY'))::integer        as catch_year,
  extract(month from to_date(c.date, 'DD/MM/YYYY'))::integer        as catch_month,

  -- Derived: season
  case extract(month from to_date(c.date, 'DD/MM/YYYY'))
    when 3 then 'spring' when 4 then 'spring' when 5 then 'spring'
    when 6 then 'summer' when 7 then 'summer' when 8 then 'summer'
    when 9 then 'autumn' when 10 then 'autumn' when 11 then 'autumn'
    else 'winter'
  end                                                               as season,

  -- Derived: time bucket (null when time_of_day is null / not yet recorded)
  case
    when c.time_of_day is null                                      then null
    when split_part(c.time_of_day, ':', 1)::integer between 6  and 11 then 'morning'
    when split_part(c.time_of_day, ':', 1)::integer between 12 and 17 then 'day'
    when split_part(c.time_of_day, ':', 1)::integer between 18 and 23 then 'evening'
    else 'night'
  end                                                               as time_bucket,

  -- Derived: wind sector (8 cardinals, passthrough for now)
  -- Future: collapse to 4 quadrants (N/E/S/W) here when query patterns justify it.
  c.wind_direction                                                  as wind_sector,

  -- Derived: catch size bucket
  -- Aligns with undersized invariant: null or < 40 → undersized = true.
  case
    when c.length_cm is null or c.length_cm < 40  then 'undersized'
    when c.length_cm between 40 and 54            then '40-54'
    when c.length_cm between 55 and 64            then '55-64'
    else                                               '65+'
  end                                                               as catch_size_bucket,

  -- Derived: water trend label (passthrough for now; null when not enriched)
  -- Future: introduce flood/ebb/slack terminology here when tide_phase is combined.
  c.water_level_trend                                               as water_trend_label,

  c.created_at

from catches c
left join spots s on s.id = c.spot_id;


-- Example analytics queries
-- ============================================================

-- Catches by season:
--   select season, count(*) from catch_analytics_view group by season;

-- Legal catches by time of day:
--   select time_bucket, count(*) as total
--   from catch_analytics_view
--   where not undersized and time_bucket is not null
--   group by time_bucket order by total desc;

-- Average length by bait (enriched rows only):
--   select bait, count(*) as n, round(avg(length_cm)::numeric, 1) as avg_cm
--   from catch_analytics_view
--   where length_cm is not null and enrichment_status = 'enriched'
--   group by bait order by n desc;

-- Catch size distribution:
--   select catch_size_bucket, count(*)
--   from catch_analytics_view
--   group by catch_size_bucket;

-- Wind sector breakdown for legal catches:
--   select wind_sector, count(*) as total
--   from catch_analytics_view
--   where not undersized and wind_sector is not null
--   group by wind_sector;

-- Year/month time series:
--   select catch_year, catch_month, count(*) as catches
--   from catch_analytics_view
--   group by catch_year, catch_month
--   order by catch_year, catch_month;
