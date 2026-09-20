-- Uzman vitrin kapak görseli ve hizmet kartı illüstrasyonu

alter table public.expert_profiles
  add column if not exists cover_url text;

comment on column public.expert_profiles.cover_url is
  'Uzman vitrin kapak görseli — Uzmanlar sekmesi profil üst bandı';

alter table public.expert_services
  add column if not exists image_url text;

comment on column public.expert_services.image_url is
  'Hizmet kartı görseli / illüstrasyon';
