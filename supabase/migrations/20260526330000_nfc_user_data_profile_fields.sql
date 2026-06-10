-- Kart sahibi profil alanları — PIN girişi sonrası profil tamamlama akışı
-- full_name, birth_date, birth_time, birth_location → nfc_user_data (kart kaynağı)

alter table public.nfc_user_data
  add column if not exists full_name text,
  add column if not exists birth_date date,
  add column if not exists birth_time time without time zone,
  add column if not exists birth_location text;

comment on column public.nfc_user_data.full_name is
  'Kart sahibi adı — profil tamamlama zorunlu alan';
comment on column public.nfc_user_data.birth_date is
  'Doğum tarihi — profil tamamlama zorunlu alan';
comment on column public.nfc_user_data.birth_time is
  'Doğum saati — profil tamamlama zorunlu alan';
comment on column public.nfc_user_data.birth_location is
  'Doğum yeri (ör. İstanbul, Kadıköy) — profil tamamlama zorunlu alan';
