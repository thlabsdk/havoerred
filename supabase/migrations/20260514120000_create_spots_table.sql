create table spots (
  id bigint generated always as identity primary key,

  name text not null,
  aliases text[] not null default '{}',

  body_of_water text,

  latitude double precision,
  longitude double precision,

  region text,
  notes text,

  owner_user_id uuid,

  created_at timestamp with time zone
  default timezone('utc'::text, now()) not null,

  updated_at timestamp with time zone
  default timezone('utc'::text, now())
);

-- Same (owner, name) cannot repeat. NULLS NOT DISTINCT (Postgres 15+) treats two
-- NULL owners as equal for the constraint, which is what we want during the
-- solo-user phase before auth ships. Switches naturally to per-user uniqueness
-- once owner_user_id is populated.
alter table spots
  add constraint spots_owner_name_unique
  unique nulls not distinct (owner_user_id, name);

create index spots_body_of_water_idx on spots (body_of_water);
create index spots_owner_idx on spots (owner_user_id);
