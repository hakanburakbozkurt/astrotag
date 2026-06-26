-- NFC çekirdek şema (başlangıç) — trusted_devices (20260526250000) öncesinde çalışmalı
-- profiles tablosu mevcut olmalıdır (önceki cosmic migration'lar).

-- ─── nfc_cards ───────────────────────────────────────────────────────────────
create table if not exists nfc_cards (
  id uuid primary key default gen_random_uuid(),
  unique_id text not null unique,
  is_active boolean not null default true,
  is_claimed boolean not null default false,
  owner_id uuid references auth.users (id) on delete set null,
  profile_id uuid references profiles (id) on delete set null,
  label text,
  created_at timestamptz not null default now()
);

-- Eski kurulumlarda tablo vardı ama sahiplik sütunları yoktu
alter table nfc_cards
  add column if not exists is_claimed boolean not null default false;

alter table nfc_cards
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists nfc_cards_unique_id_idx on nfc_cards (unique_id);
create index if not exists nfc_cards_active_idx on nfc_cards (unique_id, is_active);
create index if not exists nfc_cards_owner_id_idx on nfc_cards (owner_id);
create index if not exists nfc_cards_claimed_idx on nfc_cards (unique_id, is_claimed);

-- ─── nfc_sessions (262200 yoksa veya eksik sütunluysa) ─────────────────────────
create table if not exists nfc_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table nfc_sessions
  add column if not exists nfc_id uuid references nfc_cards (id) on delete cascade;

alter table nfc_sessions
  add column if not exists fingerprint text;

alter table nfc_sessions
  add column if not exists user_agent text;

create index if not exists nfc_sessions_active_idx
  on nfc_sessions (id, expires_at desc);

create index if not exists nfc_sessions_nfc_fingerprint_idx
  on nfc_sessions (nfc_id, fingerprint, expires_at desc);

create index if not exists nfc_sessions_nfc_idx
  on nfc_sessions (nfc_id, expires_at desc);

-- ─── Oturum doğrulama fonksiyonu ─────────────────────────────────────────────
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

-- ─── RLS: politika yok → yalnızca service role ───────────────────────────────
alter table nfc_cards enable row level security;
alter table nfc_sessions enable row level security;

comment on table nfc_cards is 'NFC çip unique_id — /c/[unique_id] giriş kapısı';
comment on column nfc_cards.unique_id is 'URL slug; trusted_devices.nfc_id ile aynı metin';
comment on column nfc_cards.is_claimed is 'Kart bir kullanıcıya bağlandı mı';
comment on column nfc_cards.owner_id is 'Sahip — auth.users.id';
comment on table nfc_sessions is 'Ephemeral NFC oturumları';
comment on column nfc_sessions.nfc_id is 'nfc_cards.id — kart referansı';
comment on column nfc_sessions.fingerprint is 'SHA-256(userAgent|width|height) parmak izi';
