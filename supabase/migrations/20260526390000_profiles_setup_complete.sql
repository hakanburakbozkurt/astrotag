-- profiles: kurulum tamamlandı bayrağı + telefon (opsiyonel)

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists is_profile_complete boolean not null default false;

comment on column public.profiles.phone_number is 'Opsiyonel iletişim telefonu';
comment on column public.profiles.is_profile_complete is
  'Profil kurulum formu tamamlandı — dashboard erişim kapısı';
