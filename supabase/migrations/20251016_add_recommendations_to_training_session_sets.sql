-- Migrate: add recommended weight column for progression guidance

alter table public.training_session_sets
  add column if not exists recommended_weight numeric;
