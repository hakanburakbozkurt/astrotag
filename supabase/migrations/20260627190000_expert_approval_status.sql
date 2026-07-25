-- Uzman başvuru onay durumu (davet kodu yerine admin onayı)

alter table public.expert_profiles
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected'));

comment on column public.expert_profiles.approval_status is
  'pending: inceleniyor, approved: vitrinde, rejected: reddedildi';

create index if not exists expert_profiles_approval_status_idx
  on public.expert_profiles (approval_status);

-- Mevcut yayında uzmanları onaylı say
update public.expert_profiles
set approval_status = 'approved'
where is_published = true;
