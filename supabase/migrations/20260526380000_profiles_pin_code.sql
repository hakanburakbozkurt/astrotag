-- profiles: kart PIN (checkCardPin — nfc_uid ile eşleşen profilde doğrulanır)

alter table public.profiles
  add column if not exists pin_code text;

comment on column public.profiles.pin_code is
  'NFC giriş PIN — checkCardPin profiles.nfc_uid + pin_code ile doğrular';

create index if not exists profiles_nfc_uid_pin_code_idx
  on public.profiles (nfc_uid, pin_code)
  where nfc_uid is not null
    and trim(nfc_uid) <> ''
    and pin_code is not null
    and trim(pin_code) <> '';
