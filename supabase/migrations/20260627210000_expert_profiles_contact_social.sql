-- Uzman başvurusu: iletişim ve sosyal medya alanları

alter table public.expert_profiles
  add column if not exists phone_number text not null default '',
  add column if not exists social_profile_url text not null default '';

comment on column public.expert_profiles.phone_number is
  'Uzman başvuru telefon numarası — admin doğrulama';

comment on column public.expert_profiles.social_profile_url is
  'Instagram, TikTok vb. sosyal profil bağlantısı';
