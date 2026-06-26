-- Kozmik enerji → yıldız puanları (star_points)
alter table profiles
  rename column cosmic_energy to star_points;

alter table profiles
  rename column energy_bonus to star_points_bonus;

alter table profiles
  rename column last_energy_charge to last_star_points_charge;

comment on column profiles.star_points is '0-100 arası kullanılabilir yıldız puanı';
comment on column profiles.star_points_bonus is '100 limitinin üzerine eklenebilen referans bonus yıldızları';
comment on column profiles.last_star_points_charge is 'Son yıldız puanı yükleme zamanı; 6 saat cooldown';

-- Yıldızlara Sor işlem günlüğü
create table if not exists cosmic_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  question text not null,
  star_points_delta integer not null default -1,
  created_at timestamptz not null default now()
);

create index if not exists cosmic_logs_user_created_idx
  on cosmic_logs (user_id, created_at desc);

alter table cosmic_logs enable row level security;

drop policy if exists "Users read own cosmic_logs" on cosmic_logs;
create policy "Users read own cosmic_logs"
  on cosmic_logs for select
  using (auth.uid() = user_id);

comment on table cosmic_logs is 'Yıldızlara Sor ve benzeri star_points harcama günlüğü';
