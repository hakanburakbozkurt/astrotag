-- Patch: delete_user_account — kişisel içerik hard delete
-- 20260701160000 eski sürümü uygulandıysa bu migration fonksiyonu günceller.
-- Yeni kurulumlarda 160000 zaten güncel fonksiyonu içerir; bu dosya idempotent.

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

  if v_expert_profile_id is not null then
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
