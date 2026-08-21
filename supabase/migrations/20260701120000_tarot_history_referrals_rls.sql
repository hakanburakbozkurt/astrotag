-- tarot_history + referrals — RLS (anon/authenticated doğrudan erişim kapatılır)

-- ---------------------------------------------------------------------------
-- tarot_history — user_id → profiles.id; okuma authenticated (kendi satırı)
-- Yazma yalnızca service_role (sunucu cache / AI pipeline)
-- ---------------------------------------------------------------------------
alter table public.tarot_history enable row level security;

grant select on table public.tarot_history to authenticated;
revoke all on table public.tarot_history from anon;
revoke insert, update, delete on table public.tarot_history from authenticated;

drop policy if exists "Authenticated users can read their own rows" on public.tarot_history;
drop policy if exists tarot_history_select_own on public.tarot_history;

create policy "Authenticated users can read their own rows"
  on public.tarot_history
  for select
  to authenticated
  using (public.profile_row_owned_by_session(user_id));

comment on policy "Authenticated users can read their own rows" on public.tarot_history is
  'Tarot önbelleği okuma — yazma yalnızca service_role';

-- ---------------------------------------------------------------------------
-- referrals — referrer_id / referred_id → profiles.id
-- ---------------------------------------------------------------------------
alter table public.referrals enable row level security;

grant select, insert on table public.referrals to authenticated;
revoke all on table public.referrals from anon;
revoke update, delete on table public.referrals from authenticated;

drop policy if exists referrals_select_own on public.referrals;
drop policy if exists referrals_insert_as_referred on public.referrals;

create policy referrals_select_own
  on public.referrals
  for select
  to authenticated
  using (
    public.profile_row_owned_by_session(referrer_id)
    or public.profile_row_owned_by_session(referred_id)
  );

create policy referrals_insert_as_referred
  on public.referrals
  for insert
  to authenticated
  with check (public.profile_row_owned_by_session(referred_id));

comment on policy referrals_select_own on public.referrals is
  'Kullanıcı yalnızca kendi referrer/referred kayıtlarını okuyabilir';

comment on policy referrals_insert_as_referred on public.referrals is
  'Referans kodu kullanımı — referred_id oturum sahibi olmalı';
