-- user_manifestos: uygulama katmanı sütun adları ile hizalama
-- intention → intention_text, last_message → daily_ai_message, is_completed ekle

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_manifestos'
      and column_name = 'intention'
  ) then
    alter table public.user_manifestos
      rename column intention to intention_text;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_manifestos'
      and column_name = 'last_message'
  ) then
    alter table public.user_manifestos
      rename column last_message to daily_ai_message;
  end if;
end $$;

alter table public.user_manifestos
  add column if not exists is_completed boolean not null default false;

alter table public.user_manifestos
  add column if not exists intention_text text not null default '';

alter table public.user_manifestos
  add column if not exists daily_ai_message text;

comment on column public.user_manifestos.intention_text is
  'Kullanıcının manifesto niyet metni';

comment on column public.user_manifestos.daily_ai_message is
  'Günün AI manifest cümlesi';

comment on column public.user_manifestos.is_completed is
  '21 gün / 5x55 döngüsü tamamlandı mı';

-- service_role RLS bypass — authenticated insert/update (ileride client-side kullanım için)
drop policy if exists "Users insert own manifestos" on public.user_manifestos;
create policy "Users insert own manifestos"
  on public.user_manifestos for insert
  with check (public.profile_row_owned_by_session(profile_id));

drop policy if exists "Users update own manifestos" on public.user_manifestos;
create policy "Users update own manifestos"
  on public.user_manifestos for update
  using (public.profile_row_owned_by_session(profile_id))
  with check (public.profile_row_owned_by_session(profile_id));

grant insert, update on table public.user_manifestos to authenticated;
