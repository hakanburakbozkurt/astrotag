-- Kapak görseli kaldırıldı — uzman vitrini yalnızca avatar_url kullanır

alter table public.expert_profiles
  drop column if exists cover_url;
