-- Migrate: add rest range columns for training session sets

alter table public.training_session_sets
  add column if not exists rest_seconds_min smallint,
  add column if not exists rest_seconds_max smallint;

update public.training_session_sets
set
  rest_seconds_min = coalesce(rest_seconds_min, rest_seconds),
  rest_seconds_max = coalesce(rest_seconds_max, rest_seconds)
where rest_seconds is not null;
