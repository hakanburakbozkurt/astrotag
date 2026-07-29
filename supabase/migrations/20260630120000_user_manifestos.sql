-- Kişiselleştirilmiş Manifesto Motoru — günlük niyet ve döngü takibi

create table if not exists public.user_manifestos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  technique_type text not null
    check (technique_type in ('21_days', '5x55')),
  intention_text text not null default '',
  current_day integer not null default 1 check (current_day >= 1),
  last_checked_date date,
  daily_ai_message text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, category, technique_type)
);

create index if not exists user_manifestos_profile_idx
  on public.user_manifestos (profile_id, updated_at desc);

alter table public.user_manifestos enable row level security;

drop policy if exists "Users read own manifestos" on public.user_manifestos;
create policy "Users read own manifestos"
  on public.user_manifestos for select
  using (public.profile_row_owned_by_session(profile_id));

drop policy if exists "Users insert own manifestos" on public.user_manifestos;
create policy "Users insert own manifestos"
  on public.user_manifestos for insert
  with check (public.profile_row_owned_by_session(profile_id));

drop policy if exists "Users update own manifestos" on public.user_manifestos;
create policy "Users update own manifestos"
  on public.user_manifestos for update
  using (public.profile_row_owned_by_session(profile_id))
  with check (public.profile_row_owned_by_session(profile_id));

comment on table public.user_manifestos is
  'Günlük AI manifest cümleleri — 21 gün veya 5x55 döngüsü';

grant select, insert, update on table public.user_manifestos to authenticated;
grant all on table public.user_manifestos to service_role;
