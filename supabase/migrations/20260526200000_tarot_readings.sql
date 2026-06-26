-- Kozmik Günlük: tarot ve horary okuma arşivi
create table if not exists tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('Tarot', 'Horary')),
  question text not null,
  reading_result text not null,
  cards_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tarot_readings_user_created_idx
  on tarot_readings (user_id, created_at desc);

create index if not exists tarot_readings_user_type_created_idx
  on tarot_readings (user_id, type, created_at desc);

alter table tarot_readings enable row level security;

create policy "Users read own tarot_readings"
  on tarot_readings for select
  using (auth.uid() = user_id);

create policy "Users insert own tarot_readings"
  on tarot_readings for insert
  with check (auth.uid() = user_id);

comment on table tarot_readings is 'Kozmik Günlük — Tarot ve Horary okuma arşivi';
