-- Misafir erişimi, dijital/uzman kodları ve profiles ayrıcalıklı alan koruması

alter table public.profiles
  add column if not exists is_guest boolean not null default false;

alter table public.profiles
  add column if not exists expires_at timestamptz;

alter table public.profiles
  add column if not exists guest_code text;

alter table public.profiles
  add column if not exists user_role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_user_role_check;

alter table public.profiles
  add constraint profiles_user_role_check check (user_role in ('user', 'expert'));

create unique index if not exists profiles_guest_code_unique_idx
  on public.profiles (guest_code)
  where guest_code is not null;

comment on column public.profiles.is_guest is 'Misafir oturumu — 24 saat sınırlı keşif';
comment on column public.profiles.expires_at is 'Misafir oturumunun bitiş zamanı';
comment on column public.profiles.guest_code is 'Misafir arayüz kodu (GUEST-XXXX)';
comment on column public.profiles.user_role is 'Platform rolü: user | expert (admin için profiles.role)';

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null,
  active boolean not null default true,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint access_codes_type_check check (type in ('DIG', 'EXP')),
  constraint access_codes_code_unique unique (code)
);

create index if not exists access_codes_code_active_idx
  on public.access_codes (code, type)
  where active = true;

comment on table public.access_codes is 'Dijital (DIG) ve uzman (EXP) erişim kodları — yalnızca sunucu doğrular';

alter table public.access_codes enable row level security;

revoke all on table public.access_codes from anon, authenticated;

-- Oturum açmış kullanıcılar ayrıcalıklı alanları doğrudan değiştiremez (service role bypass)
create or replace function public.guard_profiles_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  new.user_role := old.user_role;
  new.is_guest := old.is_guest;
  new.guest_code := old.guest_code;
  new.expires_at := old.expires_at;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row
  execute function public.guard_profiles_privileged_columns();
