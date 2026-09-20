-- Kozmik sosyal akış genişlemesi — kullanıcı gönderileri, beğeni, yanıt

alter table public.expert_feed
  alter column expert_profile_id drop not null;

alter table public.expert_feed
  add column if not exists context_tag text;

alter table public.expert_feed
  drop constraint if exists expert_feed_content_shape;

alter table public.expert_feed
  drop constraint if exists expert_feed_content_type_check;

alter table public.expert_feed
  add constraint expert_feed_content_type_check
  check (content_type in ('expert_announcement', 'shared_session', 'user_post'));

alter table public.expert_feed
  add constraint expert_feed_content_shape check (
    (
      content_type = 'expert_announcement'
      and expert_profile_id is not null
      and user_profile_id is null
      and share_consent = false
      and service_request_id is null
    )
    or (
      content_type = 'shared_session'
      and expert_profile_id is not null
      and user_profile_id is not null
      and share_consent = true
      and service_request_id is not null
      and session_output_data is not null
    )
    or (
      content_type = 'user_post'
      and expert_profile_id is null
      and user_profile_id is not null
      and context_tag is not null
      and length(trim(context_tag)) > 0
      and share_consent = false
      and service_request_id is null
      and session_output_data is null
    )
  );

create index if not exists expert_feed_user_post_idx
  on public.expert_feed (user_profile_id, created_at desc)
  where content_type = 'user_post';

create index if not exists expert_feed_context_tag_idx
  on public.expert_feed (context_tag, created_at desc)
  where content_type = 'user_post';

comment on column public.expert_feed.context_tag is
  'user_post: zorunlu kozmik bağlam etiketi (burç, transit, rüya vb.)';

-- Beğeniler
create table if not exists public.feed_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.expert_feed (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create index if not exists feed_likes_post_idx
  on public.feed_likes (post_id, created_at desc);

-- Kısa yanıtlar
create table if not exists public.feed_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.expert_feed (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists feed_replies_post_idx
  on public.feed_replies (post_id, created_at asc);

-- RLS helpers
create or replace function public.feed_post_owned_by_session(post_profile_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.profile_row_owned_by_session(post_profile_id);
$$;

drop policy if exists expert_feed_insert_user_post on public.expert_feed;
create policy expert_feed_insert_user_post
  on public.expert_feed
  for insert
  to authenticated
  with check (
    content_type = 'user_post'
    and expert_profile_id is null
    and user_profile_id is not null
    and context_tag is not null
    and length(trim(context_tag)) > 0
    and public.feed_post_owned_by_session(user_profile_id)
  );

comment on policy expert_feed_insert_user_post on public.expert_feed is
  'Oturum sahibi kendi adına user_post ekleyebilir — sunucu moderasyonu zorunlu';

alter table public.feed_likes enable row level security;
alter table public.feed_replies enable row level security;

grant select on table public.feed_likes to anon, authenticated;
grant select on table public.feed_replies to anon, authenticated;
grant insert, delete on table public.feed_likes to authenticated;
grant insert on table public.feed_replies to authenticated;
grant all on table public.feed_likes to service_role;
grant all on table public.feed_replies to service_role;

create policy feed_likes_public_read
  on public.feed_likes
  for select
  to anon, authenticated
  using (true);

create policy feed_likes_insert_own
  on public.feed_likes
  for insert
  to authenticated
  with check (public.profile_row_owned_by_session(profile_id));

create policy feed_likes_delete_own
  on public.feed_likes
  for delete
  to authenticated
  using (public.profile_row_owned_by_session(profile_id));

create policy feed_replies_public_read
  on public.feed_replies
  for select
  to anon, authenticated
  using (true);

create policy feed_replies_insert_own
  on public.feed_replies
  for insert
  to authenticated
  with check (public.profile_row_owned_by_session(profile_id));

-- Hesap silme: beğeni / yanıt temizliği
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

  delete from public.feed_likes where profile_id = v_profile_id;
  delete from public.feed_replies where profile_id = v_profile_id;
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
  set user_id = null, name = 'Silinmiş Hesap', avatar_url = null,
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
