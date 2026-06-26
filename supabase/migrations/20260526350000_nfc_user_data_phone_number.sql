-- nfc_user_data — kayıt tamamlama telefon alanı

alter table public.nfc_user_data
  add column if not exists phone_number text;

comment on column public.nfc_user_data.phone_number is
  'Kart sahibi telefon — /kayit-tamamla formu';
