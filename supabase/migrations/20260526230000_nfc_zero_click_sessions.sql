-- Zero-Click NFC oturum sistemi: nfc_cards + ephemeral nfc_sessions + RLS

create table if not exists nfc_cards (
  id uuid primary key default gen_random_uuid(),
  unique_id text not null unique,
  is_active boolean not null default true,
  profile_id uuid references profiles (id) on delete set null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists nfc_cards_unique_id_idx on nfc_cards (unique_id);
create index if not exists nfc_cards_active_idx on nfc_cards (unique_id, is_active);

alter table nfc_sessions
  add column if not exists nfc_id uuid references nfc_cards (id) on delete cascade,
  add column if not exists fingerprint text,
  add column if not exists user_agent text;

create index if not exists nfc_sessions_nfc_fingerprint_idx
  on nfc_sessions (nfc_id, fingerprint, expires_at desc);

create index if not exists nfc_sessions_nfc_idx
  on nfc_sessions (nfc_id, expires_at desc);

-- Aktif oturum doğrulama: nfc_id + fingerprint eşleşmesi
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

-- nfc_cards / nfc_sessions: RLS açık, politika yok → yalnızca service role erişir
alter table nfc_cards enable row level security;
alter table nfc_sessions enable row level security;

drop policy if exists nfc_sessions_select_own on nfc_sessions;
drop policy if exists profiles_nfc_session_select on profiles;
drop policy if exists profiles_nfc_session_update on profiles;

comment on table nfc_cards is 'NFC çip unique_id — /c/[unique_id] giriş kapısı';
comment on column nfc_sessions.nfc_id is 'nfc_cards.id — kart referansı';
comment on column nfc_sessions.fingerprint is 'SHA-256(userAgent|width|height) parmak izi';
comment on column nfc_sessions.expires_at is 'Ephemeral oturum — varsayılan 5 dakika';
