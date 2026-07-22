-- Hesap / kart askıya alma (ban)

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists profiles_is_active_idx
  on public.profiles (is_active);

comment on column public.profiles.is_active is
  'Hesap aktifliği — false ise PIN/NFC giriş reddedilir';

comment on column public.nfc_user_data.is_active is
  'Kart aktifliği — false ise NFC giriş reddedilir (hesap ban ile senkron tutulur)';
