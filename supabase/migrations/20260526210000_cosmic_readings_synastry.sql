-- Kozmik Günlük: tarot_readings → cosmic_readings + Synastry desteği
alter table if exists tarot_readings rename to cosmic_readings;

create table if not exists cosmic_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('Tarot', 'Horary', 'Synastry')),
  question text not null,
  reading_result text not null,
  cards_json jsonb,
  created_at timestamptz not null default now()
);

alter table cosmic_readings drop constraint if exists tarot_readings_type_check;
alter table cosmic_readings drop constraint if exists cosmic_readings_type_check;
alter table cosmic_readings add constraint cosmic_readings_type_check
  check (type in ('Tarot', 'Horary', 'Synastry'));

alter index if exists tarot_readings_user_created_idx
  rename to cosmic_readings_user_created_idx;

alter index if exists tarot_readings_user_type_created_idx
  rename to cosmic_readings_user_type_created_idx;

create index if not exists cosmic_readings_user_created_idx
  on cosmic_readings (user_id, created_at desc);

create index if not exists cosmic_readings_user_type_created_idx
  on cosmic_readings (user_id, type, created_at desc);

alter table cosmic_readings enable row level security;

drop policy if exists "Users read own tarot_readings" on cosmic_readings;
drop policy if exists "Users insert own tarot_readings" on cosmic_readings;
drop policy if exists "Users read own cosmic_readings" on cosmic_readings;
drop policy if exists "Users insert own cosmic_readings" on cosmic_readings;

create policy "Users read own cosmic_readings"
  on cosmic_readings for select
  using (auth.uid() = user_id);

create policy "Users insert own cosmic_readings"
  on cosmic_readings for insert
  with check (auth.uid() = user_id);

comment on table cosmic_readings is 'Kozmik Günlük — Tarot, Horary ve Synastry arşivi';
