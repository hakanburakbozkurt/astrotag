-- expert_profiles vitrin okuması — mobil/anon istemci (web service_role yerine RLS)
-- expert_profiles tablosunda RLS açık ancak SELECT policy yoktu; anon/authenticated boş dizi alıyordu.

drop policy if exists expert_profiles_public_vitrine_read on public.expert_profiles;
create policy expert_profiles_public_vitrine_read
  on public.expert_profiles
  for select
  to anon, authenticated
  using (
    is_published = true
    and approval_status = 'approved'
  );

comment on policy expert_profiles_public_vitrine_read on public.expert_profiles is
  'Yayında ve onaylı uzman vitrin satırları herkese açık (phone_number sütun grant dışında)';

-- Uzman hizmet kartları — yalnızca aktif + yayında uzmana bağlı
drop policy if exists expert_services_public_vitrine_read on public.expert_services;
create policy expert_services_public_vitrine_read
  on public.expert_services
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.expert_profiles ep
      where ep.id = expert_profile_id
        and ep.is_published = true
        and ep.approval_status = 'approved'
    )
  );

drop policy if exists expert_articles_public_vitrine_read on public.expert_articles;
create policy expert_articles_public_vitrine_read
  on public.expert_articles
  for select
  to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.expert_profiles ep
      where ep.id = expert_profile_id
        and ep.is_published = true
        and ep.approval_status = 'approved'
    )
  );
