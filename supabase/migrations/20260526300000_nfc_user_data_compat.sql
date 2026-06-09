-- nfc_user_data — production kart kaynağı (nfc_cards yerine)
-- URL slug: nfc_id (ör. at_2f8a9c4d) — eski unique_id karşılığı

comment on table public.nfc_user_data is
  'NFC kart kayıtları — /c/{nfc_id} giriş kapısı';

comment on column public.nfc_user_data.nfc_id is
  'URL slug; NFC etiketindeki at_xxx değeri';

-- PIN auth ve oturum akışı için gerekli sütunlar (yoksa eklenir)
alter table public.nfc_user_data
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists nfc_id text,
  add column if not exists is_active boolean not null default true,
  add column if not exists profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists is_claimed boolean not null default false,
  add column if not exists owner_id uuid references auth.users (id) on delete set null,
  add column if not exists pin_hash text,
  add column if not exists pin_set_at timestamptz,
  add column if not exists pin_failed_attempts integer not null default 0,
  add column if not exists pin_locked_until timestamptz;

create unique index if not exists nfc_user_data_nfc_id_idx
  on public.nfc_user_data (nfc_id);

create index if not exists nfc_user_data_active_idx
  on public.nfc_user_data (nfc_id, is_active);

alter table public.nfc_user_data enable row level security;
