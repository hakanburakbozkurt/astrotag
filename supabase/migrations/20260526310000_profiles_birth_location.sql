-- profiles: il / ilçe alanları (doğum yeri ayrıştırması)
alter table public.profiles
  add column if not exists birth_city text;

alter table public.profiles
  add column if not exists birth_district text;

comment on column public.profiles.birth_city is 'Doğum ili';
comment on column public.profiles.birth_district is 'Doğum ilçesi';
