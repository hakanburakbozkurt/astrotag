-- expert_profiles: about / experience_text + phone_number gizliliği + avatar storage

-- ---------------------------------------------------------------------------
-- Yeni profil alanları (about_text ile geriye uyumlu)
-- ---------------------------------------------------------------------------
alter table public.expert_profiles
  add column if not exists about text,
  add column if not exists experience_text text;

comment on column public.expert_profiles.about is
  'Uzman biyografi — vitrin (about_text ile senkron tutulur)';
comment on column public.expert_profiles.experience_text is
  'Uzman tecrübe detayları — vitrin';

update public.expert_profiles
set about = nullif(trim(about_text), '')
where about is null
  and about_text is not null
  and trim(about_text) <> '';

alter table public.expert_profiles
  alter column phone_number drop not null;

alter table public.expert_profiles
  alter column phone_number drop default;

comment on column public.expert_profiles.phone_number is
  'Gizli WhatsApp/telefon — yalnızca uzman paneli ve service_role; vitrinde gösterilmez';

-- ---------------------------------------------------------------------------
-- phone_number sütunu: anon/authenticated SELECT yok (sütun düzeyi yetki)
-- ---------------------------------------------------------------------------
revoke all on table public.expert_profiles from anon, authenticated;

grant select (
  id,
  profile_id,
  display_name,
  title,
  tradition,
  experience_years,
  about_text,
  about,
  experience_text,
  philosophy_text,
  avatar_url,
  is_published,
  vitrine_sort,
  approval_status,
  social_profile_url,
  earnings_balance_try,
  created_at,
  updated_at
) on table public.expert_profiles to anon, authenticated;

-- phone_number bilinçli olarak grant listesinde yok — service_role tam erişim

-- ---------------------------------------------------------------------------
-- Supabase Storage — expert-avatars bucket (public read, write = service_role)
-- NOT: storage.objects üzerinde ALTER yapılmaz (Supabase sistem tablosu).
-- Yükleme uploadExpertAvatarAction → createServiceRoleClient (RLS bypass).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expert-avatars',
  'expert-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket metadata (opsiyonel listeleme / SDK)
drop policy if exists expert_avatars_bucket_public_read on storage.buckets;
create policy expert_avatars_bucket_public_read
  on storage.buckets
  for select
  to anon, authenticated
  using (id = 'expert-avatars');

-- Herkes avatar URL ile okuyabilir (public bucket)
drop policy if exists expert_avatars_public_read on storage.objects;
create policy expert_avatars_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'expert-avatars');

-- INSERT/UPDATE/DELETE policy yok — yalnızca service_role (server action) yazar.
