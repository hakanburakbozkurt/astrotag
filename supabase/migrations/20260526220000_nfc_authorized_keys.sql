-- NFC tabanlı yetkilendirme
create table if not exists nfc_authorized_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  is_used boolean not null default false,
  profile_id uuid references profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists nfc_authorized_keys_hash_idx
  on nfc_authorized_keys (key_hash);

create table if not exists nfc_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  key_id uuid not null references nfc_authorized_keys (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists nfc_sessions_active_idx
  on nfc_sessions (id, expires_at desc);

alter table nfc_authorized_keys enable row level security;
alter table nfc_sessions enable row level security;

-- Anon/authenticated erişimi kapalı; yalnızca service role (RLS bypass) kullanır.
comment on table nfc_authorized_keys is 'NFC kart hash anahtarları — yalnızca server-side erişim';
comment on table nfc_sessions is 'NFC oturum kayıtları — httpOnly cookie ile eşleşir';
