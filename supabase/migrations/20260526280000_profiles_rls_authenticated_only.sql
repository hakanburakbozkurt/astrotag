-- profiles: anon erişimini kaldır, yalnızca authenticated + service role (bypass)

revoke all on table public.profiles from anon;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_nfc_session_select on public.profiles;
drop policy if exists profiles_nfc_session_update on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_insert_authenticated on public.profiles;
drop policy if exists profiles_update_authenticated on public.profiles;
drop policy if exists profiles_anon_select on public.profiles;
drop policy if exists profiles_anon_insert on public.profiles;
drop policy if exists profiles_anon_update on public.profiles;
drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_public_insert on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

alter table public.profiles enable row level security;

create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy profiles_insert_authenticated
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy profiles_update_authenticated
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
