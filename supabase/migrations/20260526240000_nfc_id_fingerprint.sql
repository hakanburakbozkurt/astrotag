-- nfc_sessions: legacy sütun temizliği → nfc_id + fingerprint uyumu

alter table nfc_sessions drop constraint if exists nfc_sessions_key_id_fkey;
alter table nfc_sessions drop column if exists key_id;
alter table nfc_sessions drop column if exists auth_user_id;

drop index if exists nfc_sessions_auth_fingerprint_idx;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'nfc_sessions' and column_name = 'nfc_card_id'
  ) then
    alter table nfc_sessions rename column nfc_card_id to nfc_id;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'nfc_sessions' and column_name = 'device_id'
  ) then
    alter table nfc_sessions rename column device_id to fingerprint;
  end if;
end $$;

alter table nfc_sessions
  add column if not exists nfc_id uuid references nfc_cards (id) on delete cascade,
  add column if not exists fingerprint text;

create index if not exists nfc_sessions_nfc_fingerprint_idx
  on nfc_sessions (nfc_id, fingerprint, expires_at desc);

-- Eski auth_user_id tabanlı politikaları kaldır (service role dışı erişim kapalı)
drop policy if exists nfc_sessions_select_own on nfc_sessions;
drop policy if exists profiles_nfc_session_select on profiles;
drop policy if exists profiles_nfc_session_update on profiles;

-- Eski parametresiz fonksiyon varsa kaldır
drop function if exists public.is_valid_nfc_session();

create or replace function public.is_valid_nfc_session(
  p_nfc_id uuid,
  p_fingerprint text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from nfc_sessions ns
    where ns.nfc_id = p_nfc_id
      and ns.expires_at > now()
      and ns.fingerprint is not null
      and ns.fingerprint = p_fingerprint
  );
$$;

revoke all on function public.is_valid_nfc_session(uuid, text) from public;
grant execute on function public.is_valid_nfc_session(uuid, text) to service_role;

comment on column nfc_sessions.nfc_id is 'nfc_cards.id — kart referansı';
comment on column nfc_sessions.fingerprint is 'SHA-256(userAgent|width|height)';
