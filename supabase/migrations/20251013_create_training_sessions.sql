-- Migrate: create training sessions and sets tables

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_code text not null check (template_code in ('A', 'B', 'C', 'D')),
  scheduled_date date,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'in-progress', 'completed')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.training_session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  exercise_order smallint not null,
  set_number smallint not null,
  target_reps text not null,
  target_rir text not null,
  rest_seconds integer not null,
  performed_reps smallint,
  performed_rir smallint,
  weight numeric,
  logged_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint training_session_sets_unique_set unique (session_id, exercise_id, set_number)
);

create index if not exists training_sessions_user_id_idx on public.training_sessions (user_id, scheduled_date desc);
create index if not exists training_session_sets_session_id_idx on public.training_session_sets (session_id, set_number);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_training_sessions_updated on public.training_sessions;
create trigger trg_training_sessions_updated
before update on public.training_sessions
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_training_session_sets_updated on public.training_session_sets;
create trigger trg_training_session_sets_updated
before update on public.training_session_sets
for each row
execute procedure public.set_updated_at();

alter table public.training_sessions enable row level security;
alter table public.training_session_sets enable row level security;

drop policy if exists "Users can access own training_sessions" on public.training_sessions;
create policy "Users can access own training_sessions" on public.training_sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can access own training_session_sets" on public.training_session_sets;
create policy "Users can access own training_session_sets" on public.training_session_sets
  for all using (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_sets.session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_sets.session_id and s.user_id = auth.uid()
  ));
