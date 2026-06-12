-- profiles.nfc_uid: NULL backfill (nfc_user_data + nfc_sessions) + benzersiz kısıt
--
-- Amaç: NFC slug (at_xxx) ile profil eşlemesini kalıcı hale getirmek;
-- mükerrer profil açılmasını engellemek için kısmi UNIQUE index.

alter table public.profiles
  add column if not exists nfc_uid text;

comment on column public.profiles.nfc_uid is
  'NFC kart slug (nfc_user_data.nfc_id) — kart tanıma anahtarı';

-- 1) nfc_user_data.profile_id üzerinden doğrudan eşleme
update public.profiles p
set nfc_uid = trim(u.nfc_id)
from public.nfc_user_data u
where u.profile_id = p.id
  and u.nfc_id is not null
  and trim(u.nfc_id) <> ''
  and (p.nfc_uid is null or trim(p.nfc_uid) = '');

-- 2) nfc_sessions → nfc_user_data üzerinden (profil başına en güncel oturum)
with latest_session as (
  select distinct on (s.profile_id)
    s.profile_id,
    trim(u.nfc_id) as nfc_slug
  from public.nfc_sessions s
  join public.nfc_user_data u on u.id = s.nfc_id
  where u.nfc_id is not null
    and trim(u.nfc_id) <> ''
  order by s.profile_id, s.created_at desc nulls last, s.expires_at desc nulls last
)
update public.profiles p
set nfc_uid = ls.nfc_slug
from latest_session ls
where p.id = ls.profile_id
  and (p.nfc_uid is null or trim(p.nfc_uid) = '');

-- 3) Aynı nfc_uid birden fazla profile yazılmışsa: kanonik olanı bırak
with ranked as (
  select
    p.id,
    row_number() over (
      partition by trim(p.nfc_uid)
      order by
        case
          when exists (
            select 1
            from public.nfc_user_data u
            where u.profile_id = p.id
              and trim(u.nfc_id) = trim(p.nfc_uid)
          ) then 0
          else 1
        end,
        (
          select max(s.created_at)
          from public.nfc_sessions s
          where s.profile_id = p.id
        ) desc nulls last,
        p.created_at desc nulls last,
        p.id
    ) as rn
  from public.profiles p
  where p.nfc_uid is not null
    and trim(p.nfc_uid) <> ''
)
update public.profiles p
set nfc_uid = null
from ranked r
where p.id = r.id
  and r.rn > 1;

-- 4) Kısmi UNIQUE: NULL ve boş slug serbest; dolu slug tek profile
drop index if exists public.profiles_nfc_uid_unique_idx;

create unique index profiles_nfc_uid_unique_idx
  on public.profiles (nfc_uid)
  where nfc_uid is not null
    and trim(nfc_uid) <> '';

comment on index public.profiles_nfc_uid_unique_idx is
  'NFC slug başına tek profil — NULL/boş değerler hariç';
