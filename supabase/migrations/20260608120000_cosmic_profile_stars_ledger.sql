-- Kozmik Profil: stars_ledger, geri bildirim logları, cosmic_readings tip genişlemesi

create table if not exists stars_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  transaction_type text not null,
  star_points_delta integer not null,
  reference_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stars_ledger_user_created_idx
  on stars_ledger (user_id, created_at desc);

create index if not exists stars_ledger_type_idx
  on stars_ledger (transaction_type);

alter table stars_ledger enable row level security;

drop policy if exists "Users read own stars_ledger" on stars_ledger;
create policy "Users read own stars_ledger"
  on stars_ledger for select
  using (auth.uid() = user_id);

comment on table stars_ledger is 'Yıldız harcama ve iade defteri (COSMIC_PROFILE_*, REFUND_ANALYSIS)';

create table if not exists analysis_feedback_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  module text not null default 'cosmic-profile',
  feedback text not null,
  tier text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analysis_feedback_logs_user_created_idx
  on analysis_feedback_logs (user_id, created_at desc);

alter table analysis_feedback_logs enable row level security;

comment on table analysis_feedback_logs is 'Hatalı analiz geri bildirimleri — Hatalı_AI_Çıktısı teknik kayıt';

-- Kozmik Günlük: CosmicProfile tipi
alter table cosmic_readings drop constraint if exists cosmic_readings_type_check;
alter table cosmic_readings add constraint cosmic_readings_type_check
  check (type in ('Tarot', 'Horary', 'Synastry', 'CosmicProfile'));

comment on table cosmic_readings is 'Kozmik Günlük — Tarot, Horary, Synastry ve Kozmik Profil arşivi';
