-- Referans sistemi + bonus enerji
alter table profiles
  add column if not exists referral_code text;

alter table profiles
  add column if not exists energy_bonus integer not null default 0;

create unique index if not exists profiles_referral_code_key
  on profiles (referral_code)
  where referral_code is not null;

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles (id) on delete cascade,
  referred_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint referrals_referred_id_key unique (referred_id)
);

create index if not exists referrals_referrer_id_idx on referrals (referrer_id);

comment on column profiles.referral_code is 'REFASTRO- ön ekli benzersiz davet kodu';
comment on column profiles.energy_bonus is '100 limitinin üzerine eklenebilen referans bonus enerjisi';
comment on table referrals is 'Her referred_id yalnızca bir kez kod kullanabilir';
