-- expert-avatars storage — idempotent patch (20260701180000 uygulandıysa da güvenle çalışır)

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

drop policy if exists expert_avatars_bucket_public_read on storage.buckets;
create policy expert_avatars_bucket_public_read
  on storage.buckets
  for select
  to anon, authenticated
  using (id = 'expert-avatars');

drop policy if exists expert_avatars_public_read on storage.objects;
create policy expert_avatars_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'expert-avatars');
