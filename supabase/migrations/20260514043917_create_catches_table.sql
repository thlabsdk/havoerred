create table catches (
  id bigint generated always as identity primary key,

  date text not null,
  location text not null,

  fjord text,

  bait text not null,

  length_cm integer,

  undersized boolean default false,

  wind_direction text,

  notes text not null,

  created_at timestamp with time zone
  default timezone('utc'::text, now()) not null,

  updated_at timestamp with time zone
  default timezone('utc'::text, now())
);