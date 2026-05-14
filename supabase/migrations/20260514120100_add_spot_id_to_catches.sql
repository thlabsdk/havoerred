alter table catches
  add column spot_id bigint references spots(id) on delete set null;

create index catches_spot_id_idx on catches (spot_id);
