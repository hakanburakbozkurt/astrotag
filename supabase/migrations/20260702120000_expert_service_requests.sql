-- Hizmet satın alma talepleri — profil bağlamı otomatik doldurulur, ledger ile eşleşir

create table if not exists public.expert_service_requests (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references public.expert_earnings_ledger(id) on delete set null,
  user_profile_id uuid not null references public.profiles(id) on delete cascade,
  expert_profile_id uuid not null references public.expert_profiles(id) on delete cascade,
  service_id uuid references public.expert_services(id) on delete set null,
  context_snapshot jsonb not null default '{}'::jsonb,
  client_note text,
  created_at timestamptz not null default now()
);

create index if not exists expert_service_requests_expert_idx
  on public.expert_service_requests (expert_profile_id, created_at desc);

create index if not exists expert_service_requests_user_idx
  on public.expert_service_requests (user_profile_id, created_at desc);

comment on table public.expert_service_requests is
  'Uzman hizmet satın alma talepleri — doğum/partner bilgisi profilden otomatik alınır';

alter table public.expert_service_requests enable row level security;

grant all on table public.expert_service_requests to service_role;
