-- profiles: anonymous + authenticated — yalnızca kendi satırı (auth.uid() = user_id)
-- Oturum açmamış (anon) rolü profiles'a erişemez; service role RLS bypass eder.

revoke all on table public.profiles from anon;

grant select, insert, update on table public.profiles to authenticated;

-- JWT oturumu var mı (anonymous dahil authenticated rolü)
create or replace function public.auth_session_user_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid();
$$;

comment on function public.auth_session_user_id() is
  'RLS helper — oturumdaki auth.users.id (anonymous sign-in dahil)';

-- Satır bu oturuma ait mi?
create or replace function public.profile_owned_by_session(profile_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select profile_user_id is not null
    and public.auth_session_user_id() is not null
    and profile_user_id = public.auth_session_user_id();
$$;

comment on function public.profile_owned_by_session(uuid) is
  'profiles.user_id yalnızca oturum sahibi auth.uid() ile eşleşirse true';

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_insert_authenticated on public.profiles;
drop policy if exists profiles_update_authenticated on public.profiles;
drop policy if exists profiles_anon_select on public.profiles;
drop policy if exists profiles_anon_insert on public.profiles;
drop policy if exists profiles_anon_update on public.profiles;
drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_public_insert on public.profiles;
drop policy if exists profiles_select_own_user on public.profiles;
drop policy if exists profiles_insert_own_user on public.profiles;
drop policy if exists profiles_update_own_user on public.profiles;

-- SELECT: anonymous dahil authenticated — yalnızca kendi profili
create policy profiles_select_own_user
  on public.profiles
  for select
  to authenticated
  using (public.profile_owned_by_session(user_id));

comment on policy profiles_select_own_user on public.profiles is
  'Anonymous ve kalıcı oturumlar yalnızca user_id = auth.uid() satırını okuyabilir';

-- INSERT: yalnızca kendi user_id ile yeni satır
create policy profiles_insert_own_user
  on public.profiles
  for insert
  to authenticated
  with check (public.profile_owned_by_session(user_id));

comment on policy profiles_insert_own_user on public.profiles is
  'Yeni profiles satırında user_id oturumdaki auth.uid() olmalıdır';

-- UPDATE: yalnızca kendi satırı
create policy profiles_update_own_user
  on public.profiles
  for update
  to authenticated
  using (public.profile_owned_by_session(user_id))
  with check (public.profile_owned_by_session(user_id));

comment on policy profiles_update_own_user on public.profiles is
  'Anonymous ve kalıcı oturumlar yalnızca kendi profil satırını güncelleyebilir';
