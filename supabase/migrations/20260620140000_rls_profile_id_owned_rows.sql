-- Child tablolarda user_id = profiles.id (PK), auth.users.id değil.
-- auth.uid() = user_id karşılaştırması bu yüzden hiçbir satırı eşleştirmez.
-- profiles.user_id = auth.uid() üzerinden sahiplik doğrulaması yapılır.

-- ---------------------------------------------------------------------------
-- Helper: profiles.id satırı oturumdaki kullanıcıya mı ait?
-- ---------------------------------------------------------------------------
create or replace function public.profile_row_owned_by_session(profile_row_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select profile_row_id is not null
    and public.auth_session_user_id() is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_row_id
        and p.user_id = public.auth_session_user_id()
    );
$$;

comment on function public.profile_row_owned_by_session(uuid) is
  'profiles.id FK''si taşıyan tablolarda RLS — satır oturum sahibine ait mi?';

-- profile_owned_by_session → profiles.user_id (auth.users.id) için kalır
comment on function public.profile_owned_by_session(uuid) is
  'profiles.user_id sütunu için RLS — değer auth.uid() ile eşleşmeli';

-- ---------------------------------------------------------------------------
-- profiles — user_id = auth.users.id (mevcut mantık doğru, politikaları netleştir)
-- ---------------------------------------------------------------------------
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists profiles_select_own_user on public.profiles;
drop policy if exists "Authenticated users can read their own rows" on public.profiles;

create policy "Authenticated users can read their own rows"
  on public.profiles
  for select
  to authenticated
  using (public.profile_owned_by_session(user_id));

-- INSERT / UPDATE politikaları aynı kalır
drop policy if exists profiles_insert_own_user on public.profiles;
create policy profiles_insert_own_user
  on public.profiles
  for insert
  to authenticated
  with check (public.profile_owned_by_session(user_id));

drop policy if exists profiles_update_own_user on public.profiles;
create policy profiles_update_own_user
  on public.profiles
  for update
  to authenticated
  using (public.profile_owned_by_session(user_id))
  with check (public.profile_owned_by_session(user_id));

-- ---------------------------------------------------------------------------
-- stars_ledger — user_id → profiles.id
-- ---------------------------------------------------------------------------
grant select on table public.stars_ledger to authenticated;
revoke insert, update, delete on table public.stars_ledger from anon, authenticated;

drop policy if exists "Users read own stars_ledger" on public.stars_ledger;
drop policy if exists "Authenticated users can read their own rows" on public.stars_ledger;

create policy "Authenticated users can read their own rows"
  on public.stars_ledger
  for select
  to authenticated
  using (public.profile_row_owned_by_session(user_id));

comment on policy "Authenticated users can read their own rows" on public.stars_ledger is
  'Yazma yalnızca service_role (sunucu) — istemci INSERT/UPDATE/DELETE yok';

-- ---------------------------------------------------------------------------
-- cosmic_readings — user_id → profiles.id
-- ---------------------------------------------------------------------------
grant select, insert on table public.cosmic_readings to authenticated;
revoke update, delete on table public.cosmic_readings from anon, authenticated;

drop policy if exists "Users read own cosmic_readings" on public.cosmic_readings;
drop policy if exists "Users insert own cosmic_readings" on public.cosmic_readings;
drop policy if exists "Users read own tarot_readings" on public.cosmic_readings;
drop policy if exists "Users insert own tarot_readings" on public.cosmic_readings;
drop policy if exists "Authenticated users can read their own rows" on public.cosmic_readings;
drop policy if exists "Authenticated users can insert their own rows" on public.cosmic_readings;

create policy "Authenticated users can read their own rows"
  on public.cosmic_readings
  for select
  to authenticated
  using (public.profile_row_owned_by_session(user_id));

create policy "Authenticated users can insert their own rows"
  on public.cosmic_readings
  for insert
  to authenticated
  with check (public.profile_row_owned_by_session(user_id));

-- ---------------------------------------------------------------------------
-- user_badges — user_id → profiles.id; okuma authenticated, yazma service_role
-- ---------------------------------------------------------------------------
grant select on table public.user_badges to authenticated;
revoke insert, update, delete on table public.user_badges from anon, authenticated;

drop policy if exists user_badges_select_own on public.user_badges;
drop policy if exists "Authenticated users can read their own rows" on public.user_badges;

create policy "Authenticated users can read their own rows"
  on public.user_badges
  for select
  to authenticated
  using (public.profile_row_owned_by_session(user_id));

comment on policy "Authenticated users can read their own rows" on public.user_badges is
  'Rozet yazımı yalnızca service_role (badge-engine.server)';

-- ---------------------------------------------------------------------------
-- cosmic_logs — aynı FK hatası (bonus düzeltme)
-- ---------------------------------------------------------------------------
grant select on table public.cosmic_logs to authenticated;
revoke insert, update, delete on table public.cosmic_logs from anon, authenticated;

drop policy if exists "Users read own cosmic_logs" on public.cosmic_logs;
drop policy if exists "Authenticated users can read their own rows" on public.cosmic_logs;

create policy "Authenticated users can read their own rows"
  on public.cosmic_logs
  for select
  to authenticated
  using (public.profile_row_owned_by_session(user_id));
