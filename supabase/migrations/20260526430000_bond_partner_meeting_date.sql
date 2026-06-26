-- Astro-Bond: tanışma tarihi (synastry bağlamı)
alter table public.profiles
  add column if not exists partner_meeting_date date;

comment on column public.profiles.partner_meeting_date is
  'Partner ile tanışma tarihi — Astro-Bond modülü';
