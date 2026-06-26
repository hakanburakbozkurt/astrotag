-- Cihaz eşleştirme (Device-Bound Authentication)

create table if not exists trusted_devices (
  id uuid primary key default gen_random_uuid(),
  nfc_id text not null,
  device_token text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint trusted_devices_nfc_device_unique unique (nfc_id, device_token)
);

create index if not exists trusted_devices_nfc_id_idx
  on trusted_devices (nfc_id);

create index if not exists trusted_devices_user_id_idx
  on trusted_devices (user_id);

create index if not exists trusted_devices_device_token_idx
  on trusted_devices (device_token);

alter table trusted_devices enable row level security;

-- Erişim yalnızca service role (server-side doğrulama)
comment on table trusted_devices is 'NFC kartına bağlı güvenilir cihazlar — device-bound auth';
comment on column trusted_devices.nfc_id is 'nfc_cards.unique_id — hangi anahtarlık';
comment on column trusted_devices.device_token is 'Cihaz parmak izi (SHA-256 fingerprint hash)';
comment on column trusted_devices.user_id is 'Supabase auth.users — cihazı kaydeden kullanıcı';
