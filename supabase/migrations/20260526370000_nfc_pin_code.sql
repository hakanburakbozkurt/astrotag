-- 100 kartlık PIN sistemi: düz metin pin_code (checkCardPin)
-- Production tablo: nfc_user_data — nfc_cards legacy uyumluluk için de güncellenir.

alter table public.nfc_user_data
  add column if not exists pin_code text;

alter table public.nfc_cards
  add column if not exists pin_code text;

comment on column public.nfc_user_data.pin_code is
  'Kart PIN kodu — NFC girişinde checkCardPin ile doğrulanır';

comment on column public.nfc_cards.pin_code is
  'Legacy kart tablosu — pin_code (nfc_user_data ile paralel)';

create index if not exists nfc_user_data_pin_code_idx
  on public.nfc_user_data (nfc_id, pin_code)
  where pin_code is not null and trim(pin_code) <> '';
