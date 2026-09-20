-- Uzman akışı — yalnızca uzman duyuruları ve onaylı seans paylaşımları

create table if not exists public.expert_feed (
  id uuid primary key default gen_random_uuid(),
  expert_profile_id uuid not null references public.expert_profiles (id) on delete cascade,
  user_profile_id uuid references public.profiles (id) on delete cascade,
  content_type text not null
    check (content_type in ('expert_announcement', 'shared_session')),
  caption text not null default '',
  media_url text,
  session_output_data jsonb,
  service_request_id uuid references public.expert_service_requests (id) on delete set null,
  share_consent boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint expert_feed_content_shape check (
    (
      content_type = 'expert_announcement'
      and user_profile_id is null
      and share_consent = false
      and service_request_id is null
    )
    or (
      content_type = 'shared_session'
      and user_profile_id is not null
      and share_consent = true
      and service_request_id is not null
      and session_output_data is not null
    )
  )
);

create index if not exists expert_feed_created_idx
  on public.expert_feed (created_at desc);

create index if not exists expert_feed_expert_idx
  on public.expert_feed (expert_profile_id, created_at desc);

create unique index if not exists expert_feed_one_share_per_request_idx
  on public.expert_feed (service_request_id)
  where content_type = 'shared_session' and service_request_id is not null;

comment on table public.expert_feed is
  'Uzman sosyal akışı — expert_announcement veya kullanıcı onaylı shared_session';

comment on column public.expert_feed.share_consent is
  'shared_session: kullanıcı seans çıktısını akışta paylaşmayı onayladı';

-- RLS helpers
create or replace function public.expert_feed_expert_owned_by_session(ep_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select ep_id is not null
    and public.auth_session_user_id() is not null
    and exists (
      select 1
      from public.expert_profiles ep
      join public.profiles p on p.id = ep.profile_id
      where ep.id = ep_id
        and p.user_id = public.auth_session_user_id()
        and ep.approval_status = 'approved'
    );
$$;

comment on function public.expert_feed_expert_owned_by_session(uuid) is
  'Onaylı uzman profili oturum sahibine mi ait?';

create or replace function public.expert_feed_valid_shared_session(
  req_id uuid,
  ep_id uuid,
  profile_row_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select req_id is not null
    and ep_id is not null
    and profile_row_id is not null
    and public.profile_row_owned_by_session(profile_row_id)
    and exists (
      select 1
      from public.expert_service_requests r
      where r.id = req_id
        and r.user_profile_id = profile_row_id
        and r.expert_profile_id = ep_id
    );
$$;

comment on function public.expert_feed_valid_shared_session(uuid, uuid, uuid) is
  'Paylaşım talebi oturum sahibine ve uzmana ait mi?';

alter table public.expert_feed enable row level security;

grant select on table public.expert_feed to anon, authenticated;
grant insert on table public.expert_feed to authenticated;
grant all on table public.expert_feed to service_role;

create policy expert_feed_public_read
  on public.expert_feed
  for select
  to anon, authenticated
  using (is_published = true);

comment on policy expert_feed_public_read on public.expert_feed is
  'Yayında akış gönderileri herkese açık';

create policy expert_feed_insert_announcement
  on public.expert_feed
  for insert
  to authenticated
  with check (
    content_type = 'expert_announcement'
    and user_profile_id is null
    and share_consent = false
    and service_request_id is null
    and public.expert_feed_expert_owned_by_session(expert_profile_id)
  );

comment on policy expert_feed_insert_announcement on public.expert_feed is
  'Yalnızca onaylı uzman kendi duyurusunu ekleyebilir';

create policy expert_feed_insert_shared_session
  on public.expert_feed
  for insert
  to authenticated
  with check (
    content_type = 'shared_session'
    and share_consent = true
    and user_profile_id is not null
    and service_request_id is not null
    and session_output_data is not null
    and public.expert_feed_valid_shared_session(
      service_request_id,
      expert_profile_id,
      user_profile_id
    )
  );

comment on policy expert_feed_insert_shared_session on public.expert_feed is
  'Kullanıcı yalnızca sahip olduğu doğrulanmış seansı onayla paylaşabilir';

-- Hesap silme: akış gönderilerini temizle (delete_user_account patch)
create or replace function public.delete_user_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_expert_profile_id uuid;
  v_now timestamptz := now();
begin
  if v_auth_user_id is null then
    raise exception 'Not authenticated'
      using errcode = '42501';
  end if;

  select p.id into v_profile_id
  from public.profiles p
  where p.user_id = v_auth_user_id
  limit 1;

  if v_profile_id is null then
    raise exception 'Profile not found for authenticated user'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id = v_profile_id and p.deleted_at is not null
  ) then
    return jsonb_build_object('ok', true, 'already_deleted', true, 'profile_id', v_profile_id);
  end if;

  select ep.id into v_expert_profile_id
  from public.expert_profiles ep
  where ep.profile_id = v_profile_id
  limit 1;

  delete from public.tarot_history where user_id = v_profile_id;
  delete from public.tarot_readings where user_id = v_profile_id;
  delete from public.user_manifestos where profile_id = v_profile_id;
  delete from public.horary_questions where user_id = v_profile_id;
  delete from public.cosmic_readings where user_id = v_profile_id;
  delete from public.cosmic_logs where user_id = v_profile_id;
  delete from public.stars_ledger where user_id = v_profile_id;
  delete from public.analysis_feedback_logs where user_id = v_profile_id;
  delete from public.user_badges where user_id = v_profile_id;
  delete from public.referrals
  where referrer_id = v_profile_id or referred_id = v_profile_id;
  delete from public.nfc_sessions where profile_id = v_profile_id;
  delete from public.nfc_authorized_keys where profile_id = v_profile_id;
  delete from public.expert_feed where user_profile_id = v_profile_id;

  if v_expert_profile_id is not null then
    delete from public.expert_feed where expert_profile_id = v_expert_profile_id;
    delete from public.expert_articles where expert_profile_id = v_expert_profile_id;
    delete from public.expert_services where expert_profile_id = v_expert_profile_id;
  end if;

  update public.user_consents
  set user_id = null, ip_address = null, user_agent = null, anonymized_at = v_now
  where user_id = v_auth_user_id;

  update public.crystal_ledger
  set user_id = null, anonymized_at = v_now
  where user_id = v_auth_user_id;

  update public.payment_transactions set raw_response = null where profile_id = v_profile_id;

  if v_expert_profile_id is not null then
    update public.expert_profiles
    set display_name = 'Silinmiş Uzman', title = '', tradition = '', experience_years = 0,
        about_text = '', philosophy_text = '', avatar_url = null,
        is_published = false, updated_at = v_now
    where id = v_expert_profile_id;
  end if;

  update public.profiles
  set user_id = null, name = 'Silinmiş Hesap',
      birth_date = '1970-01-01', birth_time = '00:00:00', birth_place = '',
      birth_city = null, birth_district = null, relationship_status = 'İlişki Yok',
      partner_name = null, partner_birth_date = null, partner_birth_time = null,
      partner_birth_place = null, partner_meeting_date = null,
      nfc_uid = null, pin_code = null, guest_code = null, phone_number = null,
      expert_code = null, expires_at = null,
      star_points = 0, star_points_bonus = 0, crystal_balance = 0,
      referral_code = null, is_active = false, is_profile_complete = false,
      deleted_at = v_now, anonymized_at = v_now
  where id = v_profile_id;

  update public.access_codes set redeemed_by = null where redeemed_by = v_auth_user_id;
  update public.nfc_user_data set owner_id = null, profile_id = null
  where owner_id = v_auth_user_id or profile_id = v_profile_id;
  update public.nfc_cards set owner_id = null, profile_id = null
  where owner_id = v_auth_user_id or profile_id = v_profile_id;

  delete from auth.users where id = v_auth_user_id;

  return jsonb_build_object('ok', true, 'profile_id', v_profile_id, 'deleted_at', v_now);
end;
$$;
